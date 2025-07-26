import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Invoice } from './schemas/invoice.schema';
import { Model } from 'mongoose';

@Injectable()
export class IntegrationService {
    constructor(
        @InjectModel(Invoice.name) private invoiceModel: Model<Invoice>,
    ) { }

    async generateSummary() {
        const results = await this.invoiceModel.aggregate([
            {
                $group: {
                    _id: { $month: "$createdAt" },
                    total: { $sum: "$total" },
                    count: { $sum: 1 },
                }
            }
        ]);
        return { monthlyInvoiceStats: results };
    }

    async processWebhook(payload: any) {
        return { status: 'success', received: payload };
    }
}
