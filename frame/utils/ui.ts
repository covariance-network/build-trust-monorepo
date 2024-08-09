import { defaultVars, createSystem } from 'frog/ui'

export const {
  vars,
  VStack,
  Box,
  Icon,
  Image,
  Spacer,
  Divider,
  HStack,
  Heading,
  Text,
  Column,
  Columns,
  Row,
  Rows,
} = createSystem({
  colors: {
    ...defaultVars.colors,
    fcPurple: '#6944BA',
    bg: 'FCFCFD',
    white: 'white',
    black: 'black',
    red: 'red',
    green: 'green',
  },
  fonts: {
    default: [
      {
        name: 'Space Mono',
        source: 'google',
      },
    ],
  },
})
