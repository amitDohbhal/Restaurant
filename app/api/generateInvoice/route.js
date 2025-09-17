import { NextResponse } from 'next/server';
import connectDB from "@/lib/connectDB";
import RoomAccount from '@/models/RoomAccount';
import { v4 as uuidv4 } from 'uuid';
import { promises as fs } from 'fs';
import { join } from 'path';
import { create } from 'html-pdf';

export async function POST(request) {
  try {
    await connectDB();
    
    const { guestId, orderIds, paymentId, paymentMethod = 'online' } = await request.json();
    
    if (!guestId || !orderIds?.length) {
      return NextResponse.json(
        { success: false, message: 'Guest ID and order IDs are required' },
        { status: 400 }
      );
    }

    // Fetch guest and order details
    const guest = await RoomAccount.findById(guestId);
    if (!guest) {
      return NextResponse.json(
        { success: false, message: 'Guest not found' },
        { status: 404 }
      );
    }

    // Filter the orders that match the provided orderIds
    const allOrders = [...(guest.unpaidOrders || []), ...(guest.paidOrders || [])];
    const orders = allOrders.filter(order => orderIds.includes(order.orderId?.toString()));
    
    if (orders.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No matching orders found' },
        { status: 404 }
      );
    }

    // Calculate totals
    const subtotal = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const tax = orders.reduce((sum, order) => {
      const orderTax = (order.items || []).reduce((orderSum, item) => {
        const itemTax = (item.taxAmount || 0) * (item.quantity || 1);
        return orderSum + itemTax;
      }, 0);
      return sum + orderTax;
    }, 0);
    
    const total = subtotal + tax;

    // Create HTML content for the invoice
    const invoiceHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Invoice #INV-${Date.now()}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .hotel-name { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
          .invoice-info { margin-bottom: 30px; }
          .section { margin-bottom: 20px; }
          .section-title { font-size: 18px; font-weight: bold; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th { text-align: left; padding: 10px; background-color: #f5f5f5; border-bottom: 1px solid #ddd; }
          td { padding: 10px; border-bottom: 1px solid #eee; }
          .text-right { text-align: right; }
          .total-row { font-weight: bold; }
          .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #777; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="hotel-name">Hotel Shivan Residence</div>
          <div>123 Example Street, City, Country</div>
          <div>Phone: +1 234 567 8900 | Email: info@hotelshivan.com</div>
        </div>

        <div class="invoice-info">
          <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
            <div>
              <div><strong>Invoice #:</strong> INV-${Date.now()}</div>
              <div><strong>Date:</strong> ${new Date().toLocaleDateString()}</div>
            </div>
            <div style="text-align: right;">
              <div><strong>Bill To:</strong></div>
              <div>${guest.name}</div>
              ${guest.roomNumber ? `<div>Room: ${guest.roomNumber}</div>` : ''}
              ${guest.phone ? `<div>Phone: ${guest.phone}</div>` : ''}
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Order Details</div>
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Qty</th>
                <th class="text-right">Price</th>
                <th class="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              ${orders.flatMap(order => 
                (order.items || []).map(item => `
                  <tr>
                    <td>${item.name || 'Item'}</td>
                    <td>${item.quantity || 1}</td>
                    <td class="text-right">₹${(item.price || 0).toFixed(2)}</td>
                    <td class="text-right">₹${(item.total || 0).toFixed(2)}</td>
                  </tr>
                `).join('')
              ).join('')}
              <tr class="total-row">
                <td colspan="3" class="text-right">Subtotal:</td>
                <td class="text-right">₹${subtotal.toFixed(2)}</td>
              </tr>
              <tr class="total-row">
                <td colspan="3" class="text-right">Tax:</td>
                <td class="text-right">₹${tax.toFixed(2)}</td>
              </tr>
              <tr class="total-row">
                <td colspan="3" class="text-right">Total:</td>
                <td class="text-right">₹${total.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="section">
          <div class="section-title">Payment Details</div>
          <p><strong>Payment Method:</strong> ${paymentMethod === 'online' ? 'Online' : 'Cash'}</p>
          ${paymentMethod === 'online' && paymentId ? `<p><strong>Transaction ID:</strong> ${paymentId}</p>` : ''}
        </div>

        <div class="footer">
          <p>Thank you for your business!</p>
          <p>For any inquiries, please contact us at info@hotelshivan.com or call +1 234 567 8900</p>
        </div>
      </body>
      </html>
    `;

    // Generate PDF from HTML
    const pdfBuffer = await new Promise((resolve, reject) => {
      create(invoiceHtml, {
        format: 'A4',
        border: {
          top: '20mm',
          right: '10mm',
          bottom: '20mm',
          left: '10mm'
        },
        type: 'pdf',
        timeout: 30000
      }).toBuffer((err, buffer) => {
        if (err) return reject(err);
        resolve(buffer);
      });
    });

    // Create uploads directory if it doesn't exist
    const uploadDir = join(process.cwd(), 'public', 'invoices');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
    } catch (err) {
      if (err.code !== 'EEXIST') throw err;
    }
    
    // Generate unique filename
    const filename = `invoice-${uuidv4()}.pdf`;
    const filePath = join(uploadDir, filename);
    
    // Write file
    await fs.writeFile(filePath, pdfBuffer);
    
    // Return the URL to access the invoice
    const invoiceUrl = `/invoices/${filename}`;
    
    return NextResponse.json({
      success: true,
      message: 'Invoice generated successfully',
      invoiceUrl
    });
    
  } catch (error) {
    console.error('Error generating invoice:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to generate invoice',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
