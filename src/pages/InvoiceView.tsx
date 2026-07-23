import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Printer, Download, MessageCircle, ChevronLeft } from "lucide-react";
import { jsPDF } from "jspdf";
import { useAuth } from "@/context/AuthContext";
import { fetchOrder, fetchMenuItems, type Order, type MenuItem } from "@/lib/api";
import { rupeesInWords } from "@/lib/numberToWords";

export default function InvoiceView() {
  const { id } = useParams<{ id: string }>();
  const { restaurant } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([fetchOrder(id), fetchMenuItems()])
      .then(([orderRes, menuRes]) => {
        setOrder(orderRes.order);
        setMenu(menuRes.items);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  const menuById = useMemo(() => new Map(menu.map((m) => [m.id, m])), [menu]);

  const cgstPct = restaurant?.cgst ?? 2.5;
  const sgstPct = restaurant?.sgst ?? 2.5;
  const cgstAmt = order ? (order.gstAmount * cgstPct) / (cgstPct + sgstPct || 1) : 0;
  const sgstAmt = order ? order.gstAmount - cgstAmt : 0;

  function handleDownloadPdf() {
    if (!order) return;
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const left = 40;
    let y = 50;

    doc.setFontSize(16);
    doc.setTextColor(47, 92, 224);
    doc.text(restaurant?.name ?? "Restaurant", left, y);
    doc.setTextColor(100);
    doc.setFontSize(9);
    y += 16;
    if (restaurant?.address) {
      doc.text(restaurant.address, left, y);
      y += 12;
    }
    if (restaurant?.phone) {
      doc.text(restaurant.phone, left, y);
      y += 12;
    }
    doc.setTextColor(30);
    doc.setFontSize(9);
    doc.text(new Date(order.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" }), 420, 50);

    y += 14;
    doc.setDrawColor(226, 232, 240);
    doc.line(left, y, 555, y);
    y += 18;

    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text("BILLED TO", left, y);
    doc.text("RESTAURANT DETAILS", 320, y);
    y += 14;
    doc.setTextColor(30);
    doc.setFontSize(10);
    doc.text(order.tableOrNo || order.customerName, left, y);
    doc.text(`GSTIN: ${restaurant?.gstin || "—"}`, 320, y);
    y += 13;
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(`Payment: ${order.mode}`, left, y);
    doc.setFontSize(10);
    doc.setTextColor(30);
    doc.text(`FSSAI: ${restaurant?.fssai || "—"}`, 320, y);
    y += 13;
    doc.text(`State: ${restaurant?.state || "—"}`, 320, y);

    y += 22;
    doc.setDrawColor(226, 232, 240);
    doc.line(left, y, 555, y);
    y += 16;

    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text("#", left, y);
    doc.text("ITEM", left + 20, y);
    doc.text("QTY", 330, y);
    doc.text("RATE", 380, y);
    doc.text("GST%", 440, y);
    doc.text("AMOUNT", 500, y);
    y += 10;
    doc.line(left, y, 555, y);
    y += 14;

    doc.setTextColor(30);
    doc.setFontSize(9.5);
    order.items.forEach((line, i) => {
      doc.text(String(i + 1), left, y);
      doc.text(line.name, left + 20, y);
      doc.text(String(line.qty), 330, y);
      doc.text(`Rs ${line.price.toFixed(0)}`, 380, y);
      doc.text(`${line.gst}%`, 440, y);
      doc.text(`Rs ${(line.price * line.qty).toFixed(0)}`, 500, y);
      y += 16;
    });

    y += 6;
    doc.line(left, y, 555, y);
    y += 20;

    const summaryX = 400;
    doc.setFontSize(9.5);
    doc.setTextColor(100);
    doc.text("Subtotal (excl. GST)", summaryX, y);
    doc.setTextColor(30);
    doc.text(`Rs ${order.subtotal.toFixed(0)}`, 500, y);
    y += 14;
    doc.setTextColor(100);
    doc.text(`CGST (${cgstPct}%)`, summaryX, y);
    doc.setTextColor(30);
    doc.text(`Rs ${cgstAmt.toFixed(0)}`, 500, y);
    y += 14;
    doc.setTextColor(100);
    doc.text(`SGST (${sgstPct}%)`, summaryX, y);
    doc.setTextColor(30);
    doc.text(`Rs ${sgstAmt.toFixed(0)}`, 500, y);
    y += 6;
    doc.line(summaryX, y + 6, 555, y + 6);
    y += 20;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Total Amount", summaryX, y);
    doc.text(`Rs ${order.total.toFixed(0)}`, 500, y);
    doc.setFont("helvetica", "normal");

    y += 30;
    doc.setFontSize(9.5);
    doc.setTextColor(30);
    doc.text(`Amount in words: ${rupeesInWords(order.total)}`, left, y);

    y += 26;
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text("Terms & Conditions", left, y);
    y += 12;
    const terms =
      restaurant?.invoiceTerms ||
      "All sales are final. Disputes must be raised within 24 hours. This is a computer-generated invoice and does not require a signature.";
    const termLines = doc.splitTextToSize(terms, 515);
    doc.text(termLines, left, y);

    doc.save(`invoice-${order.billNo}.pdf`);
  }

  if (loading) {
    return <p className="py-20 text-center text-sm text-slate-400">Loading invoice…</p>;
  }

  if (error || !order) {
    return <p className="py-20 text-center text-sm text-slate-400">Couldn't load this invoice.</p>;
  }

  const whatsappText = encodeURIComponent(
    `Invoice from ${restaurant?.name ?? "Restaurant"}\nBill #${order.billNo}\n\nTotal Paid: ₹${order.total.toFixed(0)} (${order.mode})\n\n${
      restaurant?.invoiceFooterText || "Thank you for dining with us!"
    }`,
  );

  return (
    <div>
      <Link to="/billing" className="mb-4 flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 print:hidden">
        <ChevronLeft size={16} />
        Back to Billing
      </Link>

      <div className="mb-5 flex flex-wrap gap-3 print:hidden">
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
        >
          <Printer size={15} />
          Print
        </button>
        <button
          onClick={handleDownloadPdf}
          className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          <Download size={15} />
          Download PDF
        </button>
        <a
          href={`https://wa.me/?text=${whatsappText}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-xl bg-success-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700"
        >
          <MessageCircle size={15} />
          Send WhatsApp
        </a>
      </div>

      <div className="card mx-auto max-w-3xl overflow-hidden">
        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-lg font-bold text-brand-600">{restaurant?.name ?? "Your Restaurant"}</h1>
              {restaurant?.address && <p className="text-xs text-slate-500">{restaurant.address}</p>}
              {restaurant?.phone && <p className="text-xs text-slate-500">{restaurant.phone}</p>}
            </div>
            <p className="text-sm text-slate-500">
              {new Date(order.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-6 border-t border-slate-100 pt-5 text-sm">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Billed To</p>
              <p className="mt-1.5 font-semibold text-slate-900">{order.tableOrNo || order.customerName}</p>
              <p className="text-xs text-slate-500">Payment: {order.mode}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Restaurant Details</p>
              <div className="mt-1.5 space-y-0.5 text-xs text-slate-600">
                <p>GSTIN: {restaurant?.gstin || "—"}</p>
                <p>FSSAI: {restaurant?.fssai || "—"}</p>
                <p>State: {restaurant?.state || "—"}</p>
              </div>
            </div>
          </div>

          <div className="mt-6 overflow-x-auto border-t border-slate-100 pt-5">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-slate-400">
                  <th className="pb-2 pr-2 font-medium">#</th>
                  <th className="pb-2 pr-2 font-medium">Item</th>
                  <th className="pb-2 pr-2 text-right font-medium">Qty</th>
                  <th className="pb-2 pr-2 text-right font-medium">Rate</th>
                  <th className="pb-2 pr-2 text-right font-medium">GST%</th>
                  <th className="pb-2 pr-2 text-right font-medium">GST Amt</th>
                  <th className="pb-2 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {order.items.map((line, i) => {
                  const menuItem = line.menuItemId ? menuById.get(line.menuItemId) : undefined;
                  return (
                    <tr key={i}>
                      <td className="py-2.5 pr-2 text-slate-500">{i + 1}</td>
                      <td className="py-2.5 pr-2">
                        <p className="font-medium text-slate-800">{line.name}</p>
                        {menuItem && (
                          <p className="flex items-center gap-1.5 text-[11px] text-slate-400">
                            <span className={`h-1.5 w-1.5 rounded-full ${menuItem.foodType === "Veg" ? "bg-success-600" : "bg-danger-600"}`} />
                            {menuItem.category}
                          </p>
                        )}
                      </td>
                      <td className="py-2.5 pr-2 text-right text-slate-600">{line.qty}</td>
                      <td className="py-2.5 pr-2 text-right text-slate-600">₹{line.price.toFixed(0)}</td>
                      <td className="py-2.5 pr-2 text-right text-slate-600">{line.gst}%</td>
                      <td className="py-2.5 pr-2 text-right text-slate-600">₹{((line.price * line.qty * line.gst) / 100).toFixed(0)}</td>
                      <td className="py-2.5 text-right font-medium text-slate-800">₹{(line.price * line.qty).toFixed(0)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex justify-end">
            <div className="w-full max-w-xs space-y-1.5 text-sm">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal (excl. GST)</span>
                <span>₹{order.subtotal.toFixed(0)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>CGST ({cgstPct}%)</span>
                <span>₹{cgstAmt.toFixed(0)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>SGST ({sgstPct}%)</span>
                <span>₹{sgstAmt.toFixed(0)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-100 pt-1.5 text-base font-bold text-slate-900">
                <span>Total Amount</span>
                <span>₹{order.total.toFixed(0)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-500">
                <span>Payment Mode</span>
                <span className="font-semibold text-success-600">{order.mode}</span>
              </div>
            </div>
          </div>

          <p className="mt-6 border-t border-slate-100 pt-4 text-sm font-medium text-slate-700">
            Amount in words: <span className="font-semibold text-slate-900">{rupeesInWords(order.total)}</span>
          </p>

          <div className="mt-5">
            <p className="text-sm font-semibold text-slate-700">Terms &amp; Conditions</p>
            <p className="mt-1 text-xs text-slate-400">
              {restaurant?.invoiceTerms ||
                "All sales are final. Disputes must be raised within 24 hours. This is a computer-generated invoice and does not require a signature."}
            </p>
          </div>

          <p className="mt-4 text-[11px] text-slate-300">Generated by HotelLite · hotellite.in</p>
        </div>

        <div className="bg-brand-600 px-6 py-4 text-center text-white">
          <p className="font-semibold">{restaurant?.invoiceFooterText || "Thank you for dining with us!"}</p>
          <p className="text-xs text-white/80">We hope to see you again soon</p>
        </div>
      </div>
    </div>
  );
}
