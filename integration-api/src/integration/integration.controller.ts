import { Controller, Get, Post, Body } from '@nestjs/common';
import { IntegrationService } from './integration.service';

@Controller('integration')
export class IntegrationController {
    constructor(private readonly service: IntegrationService) { }

    @Get('reports/summary')
    getSummary() {
        return this.service.generateSummary();
    }

    @Post('webhook')
    handleWebhook(@Body() payload: any) {
        return this.service.processWebhook(payload);
    }
}
