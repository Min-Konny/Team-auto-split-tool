import { Timestamp } from 'firebase/firestore'

export interface Community {
  id: string
  name: string
  /** bcrypt hash。未設定なら null（オープン） */
  passcodeHash: string | null
  createdAt: Timestamp
}
