import type { NextApiRequest, NextApiResponse } from 'next'

/** 個別アカウント登録は廃止。コミュニティのパスワードでログインしてください。 */
export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  return res.status(410).json({
    error: '個別アカウントの登録は廃止しました。コミュニティを選んでパスワードでログインしてください。',
  })
}
