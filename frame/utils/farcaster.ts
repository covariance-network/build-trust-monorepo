const FARQUEST_BASE_URL = 'https://build.far.quest/farcaster/v2'

async function request<T>({
  path,
  method = 'GET',
}: {
  path: string
  method?: string
}) {
  path = `https://build.far.quest/farcaster/v2/${path}`
  console.log(`request for ${path}`)

  const response = await fetch(path, {
    headers: {
      accept: 'application/json',
      'API-KEY': `${process.env.FARQUEST_API_KEY}`,
    },
    method,
  })

  if (!response.ok) {
    console.error(`request for ${path}`, response.statusText)

    throw new Error(response.statusText)
  }

  const json = await response.json()

  return json as T
}

export async function getFcUser(id: string | number) {
  try {
    const data = await request<{
      result: {
        user: {
          fid: string
          followingCount: number
          followerCount: number
          pfp: {
            url: string
            verified: boolean
          }
          bio: {
            text: string
            mentions: string[]
          }
          external: boolean
          custodyAddress: string
          connectedAddress: string
          allConnectedAddresses?: {
            ethereum: string[]
            solana: string[]
          }
          username: string
          displayName: string
          registeredAt: number
        }
      }
    }>({
      path: `user${
        Number.isNaN(Number(id)) ? '-by-username?username=' : '?fid='
      }${id}`,
    })
    console.log(`getFcUser >> data for ${id}`, data)

    const user = {
      fid: Number.parseInt(data.result.user.fid),
      bio: data.result.user.bio.text,
      username: data.result.user.username,
      displayName: data.result.user.displayName,
      addresses: {
        custody: data.result.user.custodyAddress,
        ethereum: data.result.user.allConnectedAddresses?.ethereum || [],
        solana: data.result.user.allConnectedAddresses?.solana || [],
      },
      pfp: data.result.user.pfp.url,
      url: `https://warpcast.com/${data.result.user.username}`,
    }
    return user
  } catch (e) {
    console.error('getFcUser >> failed', e)

    throw e
  }
}
