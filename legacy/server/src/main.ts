import { NestFactory } from '@nestjs/core'
import * as cookieParser from 'cookie-parser'
import { dirname, join } from 'path'
import { AppModule } from './app.module'

NestFactory.create(AppModule).then(app => {
    app.enableCors({
        credentials: true,
        origin: [/gorchilov\.net$/, /(localhost)./]
    })
    app.use(cookieParser())

    app.setGlobalPrefix(process.env.BASE_URL || '/')

    app.listen(process.env.PORT || 5000)
})
