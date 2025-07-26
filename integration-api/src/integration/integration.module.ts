import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { IntegrationController } from './integration.controller';
import { IntegrationService } from './integration.service';

import { Invoice, InvoiceSchema } from './schemas/invoice.schema';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Invoice.name, schema: InvoiceSchema }])
    ],
    controllers: [IntegrationController],
    providers: [IntegrationService],
})
export class IntegrationModule { }
