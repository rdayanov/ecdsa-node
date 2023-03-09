const express = require('express')
const secp = require('ethereum-cryptography/secp256k1')
const { toHex, utf8ToBytes } = require('ethereum-cryptography/utils')

const app = express()
const cors = require('cors')
const { keccak256 } = require('ethereum-cryptography/keccak')

const port = 3042

app.use(cors())
app.use(express.json())

const balances = {
  'e87da0f955a9e2064d1612e611f63eb55d6ada79': 100,
  'c5bf7807f07058c68466d5ea4219bfa17874e8a6': 50,
  '9ff265c60d50cd2f9fa5b0880ce68043f6fc25b5': 75,
}

/**
 *
 * @type {Map<string, string>}
 */
const nonce = new Map()

/**
 *
 * @param data {Object}
 * @param nonce {string}
 * @return {Uint8Array}
 */
function hashMessage(data, nonce) {
  return keccak256(utf8ToBytes(JSON.stringify({ ...data, nonce })))
}

/**
 *
 * @param publicKey {Uint8Array}
 * @return {string}
 */
function pubKeyToAddress(publicKey) {
  return toHex(keccak256(publicKey.slice(1)).slice(-20))
}


/**
 * @type {Set<string>}
 */
const transactions = new Set()

/**
 * @param req {Request}
 * @param res {Response}
 * @param next {NextFunction}
 */
async function checkSignature(req, res, next) {
  const { signature, recovery, hash, data: { sender } } = req.body
  const publicKey = secp.recoverPublicKey(hash, signature, recovery)
  const signerAddress = pubKeyToAddress(publicKey)
  if (signerAddress !== sender) {
    return res.status(403).send({ message: 'access denied' })
  }
  return next()
}

/**
 * @param req {Request}
 * @param res {Response}
 * @param next {NextFunction}
 */
async function checkHash(req, res, next) {
  const { signature, data, hash, recovery } = req.body
  const publicKey = secp.recoverPublicKey(hash, signature, recovery)
  const signerAddress = pubKeyToAddress(publicKey)
  const dataHash = hashMessage(data, nonce.get(signerAddress))
  const hashValid = secp.verify(signature, dataHash, publicKey)
  if (!hashValid) {
    return res.status(400).send({ message: 'malicious behavior' })
  }
  return next()
}

/**
 * @param req {Request}
 * @param res {Response}
 * @param next {NextFunction}
 */
function checkDoubleSpending(req, res, next) {
  const { hash } = req.body
  if (transactions.has(hash)) {
    return res.status(400).send({ message: 'double spending not allowed' })
  }
  transactions.add(hash)
  return next()
}

app.get('/balance/:address', (req, res) => {
  const { address } = req.params
  const balance = balances[address] || 0
  res.send({ balance })
})

app.post('/send', checkSignature, checkHash, checkDoubleSpending, (req, res) => {
  const { sender, recipient, amount } = req.body.data

  setInitialBalance(sender)
  setInitialBalance(recipient)

  if (balances[sender] < amount) {
    res.status(400).send({ message: 'Not enough funds!' })
  } else {
    balances[sender] -= amount
    balances[recipient] += amount
    res.send({ balance: balances[sender] })
  }
})

app.get('/nonce/:address', (req, res) => {
  const { address } = req.params
  const salt = toHex(secp.utils.randomPrivateKey())
  nonce.set(address, salt)
  res.send(salt)
})

app.listen(port, () => {
  console.log(`Listening on port ${ port }!`)
})

function setInitialBalance(address) {
  if (!balances[address]) {
    balances[address] = 0
  }
}
