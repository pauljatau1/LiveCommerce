import jsPDF from 'jspdf';
import logoUrl from '@/assets/pdf-auqli-logo.png';

/**
 * Build a custom shipping invoice/label PDF as per product design.
 * Returns an object URL to a Blob of the PDF, suitable for embedding in iframe.
 *
 * @param {Object} params
 * @param {Object} params.order Order object from order details
 * @param {Object} params.shipping Shipping object from order details
 * @param {Object} params.buyer Buyer details
 * @param {Object} params.seller Seller details
 * @param {Array} params.items Line items
 * @returns {string} object URL
 */
export async function generateShippingInvoicePdf({ order, shipping, buyer, seller, items, addresses }) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });

  const pagePadding = 32;
  let y = pagePadding;

  const addText = (text, x, yPos, size = 12, style = 'normal', color = '#111827') => {
    doc.setTextColor(color);
    doc.setFont('helvetica', style);
    doc.setFontSize(size);
    doc.text(String(text ?? ''), x, yPos);
  };

  // Header background
  doc.setFillColor(248, 250, 252); // slate-50
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 110, 'F');

  // Load logo as data URL
  const toDataUrl = async (url) => {
    const res = await fetch(url);
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  };
  try {
    const logoDataUrl = await toDataUrl(logoUrl);
    // Draw logo
    doc.addImage(logoDataUrl, 'PNG', pagePadding, 26, 120, 36, undefined, 'FAST');
  } catch (e) {
    // Fallback: text logo
    addText('auqli', pagePadding, 50, 24, 'bold', '#0a0a0a');
  }

  // Title and date
  const headerRightX = doc.internal.pageSize.getWidth() - pagePadding;
  addText('Shipping', headerRightX - 160, 40, 18, 'bold', '#0f172a');
  const formattedDateTop = order?.createdAt ? new Date(order.createdAt).toLocaleString() : new Date().toLocaleString();
  addText(formattedDateTop, headerRightX - 160, 62, 11, 'normal', '#475569');

  // PAID badge (top-right)
  const badgeW = 80; const badgeH = 24;
  doc.setFillColor(22, 163, 74); // green-600
  doc.rect(headerRightX - badgeW, 26, badgeW, badgeH, 'F');
  addText('PAID', headerRightX - badgeW + 20, 43, 12, 'bold', '#ffffff');

  y = 110;

  y += 24;
  addText('Order Information', pagePadding, y, 13, 'bold', '#111827');

  y += 8;
  doc.setDrawColor('#e5e7eb');
  doc.line(pagePadding, y, doc.internal.pageSize.getWidth() - pagePadding, y);

  y += 18;
  const rowGap = 18;
  const labelColor = '#6b7280';
  const rightX = 300;

  const shipperName = shipping?.carrier?.name || shipping?.carrier || '-';
  addText('Carrier', pagePadding, y, 11, 'normal', labelColor);
  addText('-', rightX - 20, y, 11, 'normal', labelColor);
  addText(shipperName, rightX, y, 12, 'bold');

  y += rowGap;
  const displayOrderId = order?.order_id || order?.orderId || order?._id || '-';
  addText('Order ID', pagePadding, y, 11, 'normal', labelColor);
  addText('-', rightX - 20, y, 11, 'normal', labelColor);
  addText(displayOrderId, rightX, y, 12, 'bold');

  y += rowGap;
  addText('Order Date', pagePadding, y, 11, 'normal', labelColor);
  addText('-', rightX - 20, y, 11, 'normal', labelColor);
  addText(order?.createdAt ? new Date(order.createdAt).toDateString() : '-', rightX, y, 12, 'bold');

  y += rowGap;
  addText('Buyer', pagePadding, y, 11, 'normal', labelColor);
  addText('-', rightX - 20, y, 11, 'normal', labelColor);
  const buyerName = addresses?.delivery ? `${addresses?.delivery?.first_name || ''} ${addresses?.delivery?.last_name || ''}`.trim() : (buyer ? `${buyer.firstName ?? ''} ${buyer.lastName ?? ''}`.trim() : '-');
  addText(buyerName || '-', rightX, y, 12, 'bold');

  y += rowGap;
  addText('Seller', pagePadding, y, 11, 'normal', labelColor);
  addText('-', rightX - 20, y, 11, 'normal', labelColor);
  addText(seller?.storeName || seller?.brandName || seller?.name || '-', rightX, y, 12, 'bold');

  y += rowGap;
  addText('Shipping Address', pagePadding, y, 11, 'normal', labelColor);
  addText('-', rightX - 20, y, 11, 'normal', labelColor);
  const delAddr = addresses?.delivery;
  const addressLine = delAddr ? [delAddr?.line1, delAddr?.city, delAddr?.state].filter(Boolean).join(', ') : '-';
  addText(addressLine, rightX, y, 12, 'bold');

  y += rowGap;
  const maskPhone = (p) => {
    if (!p) return '-';
    const s = String(p);
    return `${s.slice(0,3)}xxx${s.slice(-3)}`;
  };
  addText('Customer Phone No', pagePadding, y, 11, 'normal', labelColor);
  addText('-', rightX - 20, y, 11, 'normal', labelColor);
  const phone = delAddr?.phone || buyer?.phone || buyer?.phoneNumber;
  addText(maskPhone(phone), rightX, y, 12, 'bold');

  y += 20;
  doc.setDrawColor('#e5e7eb');
  doc.line(pagePadding, y, doc.internal.pageSize.getWidth() - pagePadding, y);

  // Addresses section
  y += 24;
  addText('Addresses', pagePadding, y, 13, 'bold');
  y += 18;
  const drawAddressBlock = (title, lines) => {
    addText(title, pagePadding, y, 12, 'bold', '#111827');
    y += 16;
    lines.forEach((ln) => {
      if (ln) { addText(ln, pagePadding, y, 11, 'normal', '#374151'); y += 14; }
    });
    y += 6;
  };
  const deliveryLines = delAddr ? [
    buyerName,
    `${delAddr?.phone ? maskPhone(delAddr.phone) : ''}`,
    delAddr?.line1,
    delAddr?.line2,
    [delAddr?.city, delAddr?.state, delAddr?.zip].filter(Boolean).join(', '),
    delAddr?.country === 'NG' ? 'Nigeria' : delAddr?.country,
  ].filter(Boolean) : ['-'];
  drawAddressBlock('Delivery Address', deliveryLines);

  const productSellerWarehouseAddress = items?.[0]?.product?.seller?.warehouseDetails?.address;
  const sellerBusinessAddress = seller?.businessAddress;
  const sellerIndividualAddress = seller?.sellerAddress;
  const pickupAddr = order?.isStorePickup
    ? (addresses?.pickup || sellerBusinessAddress || sellerIndividualAddress || productSellerWarehouseAddress)
    : (productSellerWarehouseAddress || sellerBusinessAddress || sellerIndividualAddress || addresses?.pickup);
  const pickupLines = pickupAddr ? [
    seller?.storeName || seller?.businessName || 'Main Warehouse',
    pickupAddr?.addressLine1,
    pickupAddr?.addressLine2,
    [pickupAddr?.city, pickupAddr?.state, pickupAddr?.zipCode].filter(Boolean).join(', '),
    pickupAddr?.country === 'NG' ? 'Nigeria' : pickupAddr?.country,
  ].filter(Boolean) : ['-'];
  drawAddressBlock(order?.isStorePickup ? 'Store Pickup Location' : 'Warehouse/Pickup Location', pickupLines);

  // Items
  y += 24;
  addText('Items Purchased', pagePadding, y, 13, 'bold');
  y += 14;
  // Table header background
  const tableX = pagePadding;
  const tableW = doc.internal.pageSize.getWidth() - pagePadding * 2;
  const thH = 24;
  doc.setFillColor(241, 245, 249); // slate-100
  doc.rect(tableX, y, tableW, thH, 'F');
  addText('ITEM', tableX + 10, y + 16, 11, 'bold', '#334155');
  addText('QTY', tableX + 300, y + 16, 11, 'bold', '#334155');
  addText('UNIT PRICE', tableX + 360, y + 16, 11, 'bold', '#334155');
  y += thH + 10;

  y += 18;
  const safeItems = Array.isArray(items) ? items : [];
  safeItems.slice(0, 5).forEach((itm) => {
    const name = itm?.product?.name || itm?.productName || '-';
    const qty = itm?.quantity ?? 1;
    const unit = itm?.unitPrice ?? itm?.price ?? itm?.amount ?? 0;
    addText(name, tableX + 10, y, 12);
    addText(String(qty), tableX + 303, y, 12);
    addText(`₦ ${Number(unit).toLocaleString()}`, tableX + 360, y, 12, 'bold');
    y += 20;
  });

  y += 6;
  doc.line(pagePadding, y, doc.internal.pageSize.getWidth() - pagePadding, y);
  y += 18;

  const itemAmount = order?.paymentBreakdown?.items?.reduce((sum, i) => sum + (i?.amount || 0), 0) || 0;
  const pb = order?.paymentBreakdown || {};
  const fees = pb?.fees || {};
  const platformFeePerc = pb?.items?.[0]?.platformFeePercentage;
  const totalPlatformFee = Number(fees?.totalPlatformFee || 0);
  const vat = Math.round(totalPlatformFee * 0.075);
  const processingFeePerc = Number(fees?.processingFeePercentage || 0);
  const processingFee = Number(fees?.processingFee || 0);
  const totalDeductions = Number(fees?.totalDeductions ?? (totalPlatformFee + vat + processingFee));
  const sellerPayout = Number(pb?.sellerPayout || 0);

  // Fees & Deductions section
  addText('Fees & Deductions', pagePadding, y, 13, 'bold');
  y += 16;

  const feeRow = (labelLeft, valueRight) => {
    addText(labelLeft, pagePadding, y, 12, 'normal', '#64748b');
    addText(valueRight, pagePadding + 420, y, 12, 'bold', '#0f172a');
    y += 18;
  };

  feeRow(
    `Platform Fee${platformFeePerc ? ` (${platformFeePerc}%)` : ''}`,
    `-₦ ${totalPlatformFee.toLocaleString()}`
  );
  feeRow('VAT (7.5% of commission)', `-₦ ${vat.toLocaleString()}`);
  feeRow(
    `Payment Processing${processingFeePerc ? ` (${processingFeePerc}%)` : ''}`,
    `-₦ ${processingFee.toLocaleString()}`
  );

  y += 6;
  doc.setDrawColor(229, 231, 235);
  doc.line(pagePadding, y, pagePadding + 520, y);
  y += 16;

  // Totals
  addText('Total Deductions', pagePadding, y, 12, 'bold', '#111827');
  addText(`-₦ ${totalDeductions.toLocaleString()}`, pagePadding + 420, y, 12, 'bold', '#b91c1c');
  y += 22;
  doc.setFillColor(240, 253, 244);
  doc.rect(pagePadding, y - 16, 520, 36, 'F');
  addText('Your Payout', pagePadding + 10, y + 4, 13, 'bold', '#065f46');
  addText(`₦ ${sellerPayout.toLocaleString()}`, pagePadding + 420, y + 4, 13, 'bold', '#065f46');

  // Footer note
  y += 26;
  doc.setDrawColor('#e5e7eb');
  doc.line(pagePadding, y, doc.internal.pageSize.getWidth() - pagePadding, y);
  y += 22;
  addText('Payments on Auqli are processed after 24 hours.', pagePadding, y, 10, 'normal', '#6b7280');

  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);
  return url;
}


