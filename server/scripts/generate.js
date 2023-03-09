const secp = require('ethereum-cryptography/secp256k1')
const { toHex, utf8ToBytes } = require('ethereum-cryptography/utils')
const { keccak256 } = require('ethereum-cryptography/keccak')


const privateKey = secp.utils.randomPrivateKey()
console.log('private key:', toHex(privateKey))
const publicKey = secp.getPublicKey(privateKey)
console.log('public key:', toHex(keccak256(publicKey.slice(1)).slice(-20)))
signMessage(JSON.stringify({ sender: 11, amount: 23 }))

/**
 *
 * @param msg {string}
 */
async function signMessage(msg) {
  const msgHash = keccak256(utf8ToBytes(msg))
  const [sign, recovery] = await secp.sign(msgHash, privateKey, { recovered: true })
  console.log(toHex(sign), recovery)
  const recover = toHex(keccak256(secp.recoverPublicKey(msgHash, sign, recovery).slice(1)).slice(-20))
  console.log(recover)
  console.log(secp.verify(sign, msgHash, toHex(keccak256(publicKey.slice(1)).slice(-20))))
}
