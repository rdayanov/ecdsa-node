import { toHex } from 'ethereum-cryptography/utils'
import { keccak256 } from 'ethereum-cryptography/keccak'
import * as secp from 'ethereum-cryptography/secp256k1'

import server from './server'


function pubKeyToAddress(publicKey) {
  return toHex(keccak256(publicKey.slice(1)).slice(-20))
}

function privateKeyToAddress(privateKey) {
  const pubKey = secp.getPublicKey(privateKey)
  return pubKeyToAddress(pubKey)
}

function Wallet({ address, setAddress, balance, setBalance, privateKey, setPrivateKey }) {
  async function onChange(evt) {
    const privateKey = evt.target.value
    const address = privateKeyToAddress(privateKey)
    if (address) {
      setAddress(address)
      setPrivateKey(privateKey)

      const {
        data: { balance },
      } = await server.get(`balance/${ address }`)
      setBalance(balance)
    } else {
      setBalance(0)
    }
  }

  return (
    <div className="container wallet">
      <h1>Your Wallet</h1>

      <label>
        Wallet Private Key
        <input placeholder="Type a private key"
               value={ privateKey }
               onChange={ onChange }></input>
      </label>

      <div className="balance">Address: { address }</div>

      <div className="balance">Balance: { balance }</div>
    </div>
  )
}

export default Wallet
