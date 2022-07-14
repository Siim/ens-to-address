import Web3 from 'web3'
import fs from 'fs'
import path from 'path'
import readline from 'readline'

const web3 = new Web3('https://cloudflare-eth.com/')

type TAddressList = {
  address: string,
  amount: string
}

async function ensToAddress() {
  const fileStream = fs.createReadStream('./airdrop.csv');
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  })

  let json: TAddressList[] = []
  for await (const line of rl) {
    const [address, amount] = line.split(',')
    json.push({ address, amount })
  }
  const resolvedEnsAddressesPromises = json
    .filter(({ address }) => address.endsWith('.eth'))
    .map(async ({ address, amount }) => {
      try {
        const resolvedAddress = await web3.eth.ens.getAddress(address)
        return {
          address: resolvedAddress,
          ensAddress: address,
          amount
        }
      } catch (error: any) {
        return {
          address,
          amount,
          error: error.message
        }
      }
    })

  const resolvedEnsAddresses = await Promise.all(resolvedEnsAddressesPromises)
  const addressesWithoutEns = json.filter(({ address }) => !address.endsWith('.eth'))
  const result = [...resolvedEnsAddresses, ...addressesWithoutEns]
  console.log(result)
  fs.writeFileSync("./result.json", result)
}

ensToAddress()

