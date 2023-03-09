import { useState } from 'react'
import server from './server'
import { keccak256 } from 'ethereum-cryptography/keccak'
import { toHex, utf8ToBytes } from 'ethereum-cryptography/utils'
import * as secp from 'ethereum-cryptography/secp256k1'

/**
 *
 * @param data {Object}
 * @return {Uint8Array}
 */
function hashMessage(data) {
  return keccak256(utf8ToBytes(JSON.stringify(data)))
}

function Transfer({ address, setBalance, privateKey }) {
  const [sendAmount, setSendAmount] = useState('')
  const [recipient, setRecipient] = useState('')

  const setValue = (setter) => (evt) => setter(evt.target.value)

  async function transfer(evt) {
    evt.preventDefault()

    try {
      const { data: nonce } = await server.get(`nonce/${ address }`)

      const data = {
        sender: address,
        amount: parseInt(sendAmount),
        recipient,
      }
      const msg = {
        ...data,
        nonce,
      }
      const msgHash = hashMessage(msg)
      const [signature, recovery] = await secp.sign(msgHash, privateKey, { recovered: true })

      const {
        data: { balance },
      } = await server.post(`send`, {
        data,
        signature: toHex(signature),
        recovery,
        hash: toHex(msgHash),
      })
      setBalance(balance)
    } catch (ex) {
      alert(ex.response.data.message)
    }
  }

  return (
    <form className="container transfer"
          onSubmit={ transfer }>
      <h1>Send Transaction</h1>

      <label>
        Send Amount
        <input
          placeholder="1, 2, 3..."
          value={ sendAmount }
          onChange={ setValue(setSendAmount) }
        ></input>
      </label>

      <label>
        Recipient
        <input
          placeholder="Type an address, for example: 0x2"
          value={ recipient }
          onChange={ setValue(setRecipient) }
        ></input>
      </label>

      <input type="submit"
             className="button"
             value="Transfer"/>
    </form>
  )
}

export default Transfer
