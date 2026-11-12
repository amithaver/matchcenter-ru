import config from '../../payload.config'
import '@payloadcms/next/css'
import { RootLayout } from '@payloadcms/next/layouts'
import React from 'react'
import { importMap } from './admin/importMap.js'
import './custom.scss'

export const metadata = { title: 'Live Football CMS' }

export default function Layout({ children }) {
  return (
    <html lang="ru">
      <body>
        <RootLayout config={config} importMap={importMap}>
          {children}
        </RootLayout>
      </body>
    </html>
  )
}
