import { createPublicClient, http } from 'viem'
import { mainnet, sepolia } from 'viem/chains'

export const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(),
})

const mainnetClient = createPublicClient({
  chain: mainnet,
  transport: http(),
})

export async function getAddressForENS(name: string) {
  const hex = await mainnetClient.getEnsAddress({ name })

  if (!hex) {
    throw new Error('Invalid ENS name')
  }

  return hex.toLowerCase() as `0x${string}`
}
export async function getENSName(address: `0x${string}`) {
  const name = await mainnetClient.getEnsName({
    address,
  })

  if (!name) {
    throw new Error('No ens name found for this address')
  }

  return name
}
