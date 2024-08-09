/** @jsxImportSource frog/jsx */

import easAbi from '@/contracts/easAbi'
import { CUSTOM_SCHEMAS } from '@/utils/constants'
import { activeChainConfig, getAttestation } from '@/utils/eas'
import { getFcUser } from '@/utils/farcaster'
import { Box, Heading, Spacer, Text, vars, VStack } from '@/utils/ui'
import { getAddressForENS, publicClient } from '@/utils/viem'
import { SchemaEncoder } from '@ethereum-attestation-service/eas-sdk'
import { Button, type FrameIntent, Frog, TextInput } from 'frog'
import { devtools } from 'frog/dev'
// import { neynar } from 'frog/hubs'
import { handle } from 'frog/next'
import { serveStatic } from 'frog/serve-static'
import {
  encodeFunctionData,
  isAddress,
  parseEther,
  zeroAddress,
  zeroHash,
} from 'viem'

type AppState = {
  values: Record<string, string>
  fcRecipient: {
    username: string
    fid: number
  } | null
}

const app = new Frog<{ State: AppState }>({
  assetsPath: '/',
  basePath: '/api',
  ui: { vars },
  // Supply a Hub to enable frame verification.
  // hub: neynar({ apiKey: 'NEYNAR_FROG_FM' })
  title: 'Build Trust Frame',
  initialState: {
    values: {},
    fcRecipient: null,
  },
})

// Uncomment to use Edge Runtime
// export const runtime = 'edge'

app.frame('/', (c) => {
  return c.res({
    image: (
      <Box
        grow={true}
        alignVertical="center"
        backgroundColor="white"
        padding="64"
        border="1em solid rgb(71,42,145)"
      >
        <VStack gap="4">
          <Heading color="fcPurple" align="center" size="32">
            Build Trust Attestation
          </Heading>
          <Spacer size="16" />
          <Text align="center" color="black" size="18">
            Build trust through attestation of partnership
          </Text>
          <Spacer size="22" />
          <Text
            decoration="underline"
            color="fcPurple"
            align="center"
            size="14"
          >
            By @covariance
          </Text>
        </VStack>
      </Box>
    ),
    intents: [<Button action="/start">Start</Button>],
  })
})

app.frame('/start', (c) => {
  return c.res({
    image: (
      <Box
        grow={true}
        alignVertical="center"
        backgroundColor="white"
        padding="52"
        border="1em solid rgb(71,42,145)"
      >
        <VStack gap="4">
          <Heading color="fcPurple" align="center" size="32">
            Build Trust Attestation
          </Heading>
          <Spacer size="16" />
          <Text align="center" color="black" size="18">
            Nominate your partner using
          </Text>
          <Spacer size="22" />
          <Box alignVertical="center" justifyContent="space-around" gap="2">
            <Text color="gray500" align="center" size="14">
              Their wallet address, ENS name
            </Text>{' '}
            <Text color="black" align="center" size="12">
              or
            </Text>
            <Text color="gray500" align="center" size="14">
              Their Farcaster username(eg. @covariance)
            </Text>
          </Box>
        </VStack>
      </Box>
    ),
    intents: [
      <TextInput placeholder="Address/ENS or FC @username" />,
      <Button value="address" action="/data">
        Submit
      </Button>,
      <Button action="/">Reset</Button>,
    ],
  })
})

app.frame('/data', async (c) => {
  const { buttonValue, status, deriveState } = c
  const steps = ['address', 'company0', 'company1', 'finished'] as const

  if (!(buttonValue && c.inputText)) {
    return c.error({ message: 'Sorry, a value is required' })
  }

  const step = buttonValue as (typeof steps)[number]
  if (!steps.includes(step)) {
    return c.error({ message: 'Sorry, this entry field does not exist' })
  }

  const inputText = c.inputText.trim()
  const intents: FrameIntent[] = []
  let nextStep: typeof step | undefined = undefined
  let placeholder = ''
  let description = ''
  let previousStep: string | undefined = undefined

  const state = deriveState((previousState) => {
    //
    if (step === 'company0' || step === 'company1') {
      previousState.values[step] = inputText
    }
  })

  console.log({ state, buttonValue, inputText, nextStep })

  try {
    switch (step) {
      case 'address': {
        if (inputText.endsWith('.eth')) {
          state.values.address = await getAddressForENS(inputText)
        } else if (inputText.startsWith('@')) {
          const username = inputText.slice(1)
          const user = await getFcUser(username)
          state.values.address = user.addresses.ethereum.length
            ? user.addresses.ethereum[0]
            : user.addresses.custody
        } else {
          if (!isAddress(inputText)) {
            return c.error({ message: 'Invalid Ethereum address' })
          }

          state.values.address = inputText
        }

        nextStep = 'company0'
        placeholder = 'Your company'
        description = 'Enter the name of the company where you belong to'
        break
      }

      case 'company0': {
        // state.values.company0 = inputText
        nextStep = 'company1'
        placeholder = 'The company of your partner'
        description =
          'Enter the name of the company where your partner belongs to'
        break
      }
      case 'company1': {
        // state.values.company0 = inputText
        description = 'Complete your part of the attestation'

        // nextStep = 'finished'
        previousStep = 'company0'
        break
      }

      default: {
        previousStep = 'company1'
        break
      }
    }
  } catch (e) {
    const error = e as Error
    return c.error({ message: error.message })
  }

  if (nextStep) {
    intents.push(<TextInput placeholder={placeholder} />)
    intents.push(
      <Button action="/data" value={nextStep}>
        Submit
      </Button>,
    )
  } else {
    intents.push(
      <Button.Transaction target="/attest" action="/finish">
        Attest
      </Button.Transaction>,
    )
  }

  console.log('values', { step }, state.values)

  return c.res({
    image: (
      <Box
        grow={true}
        alignVertical="center"
        backgroundColor="white"
        padding="64"
        border="1em solid rgb(71,42,145)"
      >
        <VStack gap="4">
          <Heading color="fcPurple" align="center" size="32">
            Build Trust Attestation
          </Heading>
          <Spacer size="16" />
          <Text align="center" color="black" size="18">
            {description}
          </Text>
        </VStack>
      </Box>
    ),
    intents: [
      ...intents,
      <Button value={previousStep} action={!previousStep ? '/data' : '/start'}>
        Back
      </Button>,
    ],
  })
})

app.frame('/finish', async (c) => {
  if (!c.transactionId) {
    return c.res({ image: <Box>Transaction not found</Box> })
  }

  console.log('/finish >> transactionId', c.transactionId)
  const hash = c.transactionId as `0x${string}`

  const transactionReceipt = await publicClient.waitForTransactionReceipt({
    hash,
  })
  console.log('/finish >> transactionReceipt', transactionReceipt)
  const attestUid = transactionReceipt.logs[0]?.data
  console.log('/finish >> attestUid', attestUid)

  return c.res({
    image: (
      <Box
        grow={true}
        alignVertical="center"
        backgroundColor="white"
        padding="64"
        border="1em solid rgb(71,42,145)"
      >
        <VStack gap="4">
          <Heading color="fcPurple" align="center" size="32">
            Build Trust Attestation
          </Heading>
          <Spacer size="16" />
          <Text align="center" color="black" size="18">
            Your attestation has been submitted
          </Text>
          <Spacer size="22" />
          <Text
            decoration="underline"
            color="fcPurple"
            align="center"
            size="14"
          >
            By @covariance
          </Text>
        </VStack>
      </Box>
    ),
    intents: [
      <Button.Link
        href={`https://${activeChainConfig.subdomain}easscan.org/attestation/view/${attestUid}`}
      >
        View
      </Button.Link>,
      <Button.Reset>Attest again</Button.Reset>,
    ],
  })
})

app.transaction('/attest', async (c) => {
  const { previousState } = c

  console.log('/attest', previousState)

  const schemaEncoder = new SchemaEncoder('bool metIRL')
  const encoded = schemaEncoder.encodeData([
    { name: 'metIRL', type: 'bool', value: true },
  ])

  const transactiondata = encodeFunctionData({
    abi: easAbi,
    functionName: 'attest',
    args: [
      {
        schema: CUSTOM_SCHEMAS.MET_IRL_SCHEMA,
        data: {
          recipient: previousState.values.address,
          expirationTime: BigInt(0),
          revocable: true,
          refUID: zeroHash,
          data: encoded,
          value: BigInt(0),
        },
      },
    ],
  })

  return c.send({
    chainId: `eip155:${activeChainConfig.chainId}`,
    to: activeChainConfig.contractAddress as `0x${string}`,
    data: transactiondata,
    value: parseEther('0'),
  })
})

devtools(app, { serveStatic })

export const GET = handle(app)
export const POST = handle(app)

// NOTE: That if you are using the devtools and enable Edge Runtime, you will need to copy the devtools
// static assets to the public folder. You can do this by adding a script to your package.json:
// ```json
// {
//   scripts: {
//     "copy-static": "cp -r ./node_modules/frog/_lib/ui/.frog ./public/.frog"
//   }
// }
// ```
// Next, you'll want to set up the devtools to use the correct assets path:
// ```ts
// devtools(app, { assetsPath: '/.frog' })
// ```
