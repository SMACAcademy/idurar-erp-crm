import jsPDF from 'jspdf';

export const generateInvoicePDF = (invoiceData, summary) => {
  const doc = new jsPDF();
  
  // Add company logo and header
  doc.setFontSize(20);
  doc.text('INVOICE', 105, 20, { align: 'center' });
  
  // Add invoice details
  doc.setFontSize(12);
  doc.text(`Invoice #: ${invoiceData.number}`, 20, 40);
  doc.text(`Date: ${new Date(invoiceData.date).toLocaleDateString()}`, 20, 50);
  
  // Add AI Summary section
  if (summary) {
    doc.setFontSize(14);
    doc.text('AI Summary', 20, 70);
    doc.setFontSize(10);
    
    // Split summary into lines that fit the page width
    const splitText = doc.splitTextToSize(summary, 170);
    doc.text(splitText, 20, 80);
  }
  
  // Add invoice items
  doc.setFontSize(14);
  doc.text('Items', 20, 120);
  
  // Table headers
  doc.setFontSize(10);
  doc.text('Description', 20, 130);
  doc.text('Quantity', 100, 130);
  doc.text('Price', 130, 130);
  doc.text('Total', 170, 130);
  
  // Add items
  let y = 140;
  invoiceData.items.forEach((item, index) => {
    if (y > 250) {
      doc.addPage();
      y = 20;
    }
    doc.text(item.description.substring(0, 30), 20, y);
    doc.text(item.quantity.toString(), 100, y);
    doc.text(item.price.toString(), 130, y);
    doc.text((item.quantity * item.price).toString(), 170, y);
    y += 10;
  });
  
  // Add totals
  y += 10;
  doc.setFontSize(12);
  doc.text('Total:', 130, y);
  doc.text(invoiceData.total.toString(), 170, y);
  
  return doc;
}; 