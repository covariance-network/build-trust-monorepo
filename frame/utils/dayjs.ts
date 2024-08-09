import Dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import relativeTime from 'dayjs/plugin/relativeTime'

Dayjs.extend(utc)
Dayjs.extend(localizedFormat)
Dayjs.extend(relativeTime)

export const dayjs = Dayjs.utc
