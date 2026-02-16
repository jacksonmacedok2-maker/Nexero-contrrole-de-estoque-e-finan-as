
import { Order, Product } from '../types';
import { formatCurrency, formatDate, formatTime } from '../utils/helpers';

export const printService = {
  /**
   * Prepara os dados para a futura ponte nativa Android
   */
  async printReceipt(order: any, items: any[], companyName: string = "NEXERO ENTERPRISE") {
    const receiptData = this.generateReceiptData(order, items, companyName);
    
    // 1. Tentar enviar para ponte nativa (Android WebView)
    if ((window as any).NexeroNative?.printBluetooth) {
      try {
        await (window as any).NexeroNative.printBluetooth(JSON.stringify(receiptData));
        return;
      } catch (e) {
        console.error("Erro na ponte nativa:", e);
      }
    }

    // 2. Fallback para Impressão do Navegador (Web)
    this.browserPrint(receiptData);
  },

  generateReceiptData(order: any, items: any[], companyName: string) {
    return {
      header: companyName,
      orderId: order.id.substring(0, 8).toUpperCase(),
      date: formatDate(new Date().toISOString()),
      time: formatTime(new Date().toISOString()),
      items: items.map(item => ({
        name: item.name || item.product?.name || 'Produto',
        qty: item.quantity,
        price: item.unit_price,
        total: item.total_price
      })),
      subtotal: order.total_amount,
      total: order.total_amount,
      paymentMethod: order.payment_method || 'N/A',
      footer: "Obrigado pela preferência!"
    };
  },

  browserPrint(data: any) {
    const printWindow = window.open('', '_blank', 'width=300,height=600');
    if (!printWindow) return;

    const itemsHtml = data.items.map((item: any) => `
      <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 2px;">
        <span>${item.qty}x ${item.name.substring(0, 18)}</span>
        <span>${formatCurrency(item.total)}</span>
      </div>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Imprimir Recibo</title>
          <style>
            @page { margin: 0; }
            body { 
              font-family: 'Courier New', Courier, monospace; 
              width: 58mm; 
              padding: 5mm; 
              margin: 0;
              color: #000;
            }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .divider { border-top: 1px dashed #000; margin: 5px 0; }
            .flex { display: flex; justify-content: space-between; }
            .title { font-size: 16px; margin-bottom: 5px; }
            .small { font-size: 10px; }
          </style>
        </head>
        <body>
          <div class="center bold title">${data.header}</div>
          <div class="center small">CNPJ: 00.000.000/0001-00</div>
          <div class="divider"></div>
          <div class="small">PEDIDO: #${data.orderId}</div>
          <div class="small">DATA: ${data.date} ${data.time}</div>
          <div class="divider"></div>
          <div class="bold small" style="margin-bottom: 5px;">ITENS</div>
          ${itemsHtml}
          <div class="divider"></div>
          <div class="flex bold">
            <span>TOTAL</span>
            <span>${formatCurrency(data.total)}</span>
          </div>
          <div class="small">PAGAMENTO: ${data.paymentMethod}</div>
          <div class="divider"></div>
          <div class="center small italic">${data.footer}</div>
          <script>
            window.onload = () => {
              window.print();
              setTimeout(() => window.close(), 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }
};
