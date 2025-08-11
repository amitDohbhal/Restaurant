import React from 'react'

const ReturnPolicy = () => {
  return (
    <section className="bg-[#fffaf3] py-10 px-4 md:px-12 w-full mx-auto rounded-lg shadow-sm">
      <div className="border border-black p-4 md:p-8 rounded-xl shadow-sm">
        <h2 className="text-xl md:text-2xl font-bold mb-6 text-center">Return Policy & Procedure</h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold mb-3">How We Accept Return Requests:</h3>
            <p className="mb-4 text-justify">
              If a guest wishes to return a product, we follow a simple and customer-friendly return process:
            </p>

            <div className="ml-4 space-y-4">
              <div>
                <h4 className="font-semibold">Eligibility Check:</h4>
                <ul className="list-disc ml-6 space-y-2 mt-2">
                  <li>The return request must be made within 07 days of purchase.</li>
                  <li>The product must be unused, in original packaging, and in resalable condition.</li>
                  <li>Original invoice or proof of purchase is required.</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold">Initiate Return Request:</h4>
                <p className="mt-2">
                  The guest must contact our customer service desk or email us at <a href="mailto:info@adventureaxis.in" className="text-blue-600 hover:underline">info@adventureaxis.in</a> or call <a href="tel:+911352442822" className="text-blue-600 hover:underline">+91-135-2442822</a> / <a href="tel:917669280002" className="text-blue-600 hover:underline">7669280002</a>, <a href="tel:919897468886" className="text-blue-600 hover:underline">9897468886</a> with the following details:
                </p>
                <ul className="list-disc ml-6 mt-2 space-y-1">
                  <li>Order number</li>
                  <li>Reason for return</li>
                  <li>Product photos (if damaged/defective)</li>
                </ul>
                <p className="mt-2">Include the following:</p>
                <ul className="list-disc ml-6 mt-1 space-y-1">
                  <li>Guest name and contact details</li>
                  <li>Product name and order/bill number</li>
                  <li>Clear photos or video evidence of the product (for damaged or defective items)</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold">Return Approval:</h4>
                <p className="mt-2">
                  Our team will inspect the product and process the return on the spot if eligible.
                </p>
                <p className="mt-2">
                  Once we verify the return eligibility, we will approve the request and provide further instructions (return location, pickup info, etc.).
                </p>
                <p className="mt-2">
                  In case of damaged or defective items, we may offer a replacement or full refund.
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-300 pt-6">
            <h3 className="text-xl font-semibold mb-3">Return Approval & Processing</h3>
            <p className="mb-4">
              Once your return request is received, the following steps will be taken:
            </p>
            
            <div className="ml-4 space-y-4">
              <div>
                <h4 className="font-semibold">Verification:</h4>
                <ul className="list-disc ml-6 mt-2 space-y-1">
                  <li>We verify the request and condition of the product.</li>
                  <li>For damaged or defective products, photographic evidence may be required.</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold">Approval & Instructions:</h4>
                <p className="mt-2">If the return is approved, we'll confirm by email or phone and provide:</p>
                <ul className="list-disc ml-6 mt-2 space-y-1">
                  <li>Return location or pickup instructions</li>
                  <li>Estimated processing time</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold">Inspection on Receipt:</h4>
                <ul className="list-disc ml-6 mt-2 space-y-1">
                  <li>Once we receive the returned item, it will be inspected for eligibility.</li>
                  <li>If all conditions are met, a refund or exchange will be processed within 15 business days.</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-300 pt-6">
            <h3 className="text-xl font-semibold mb-3">Refund & Exchange Terms</h3>
            
            <div className="ml-4 space-y-4">
              <div>
                <h4 className="font-semibold">Refund Mode:</h4>
                <p className="mt-2">
                  Refunds will be issued via the original payment method (credit card, UPI, cash) or credited to the guest's room bill, based on the situation.
                </p>
              </div>

              <div>
                <h4 className="font-semibold">Exchange Option:</h4>
                <p className="mt-2">
                  Guests may opt to exchange the returned product with another item of equal or higher value (price difference payable).
                </p>
              </div>

              <div>
                <h4 className="font-semibold">Deductions (if any):</h4>
                <p className="mt-2">
                  In some cases, a small handling or restocking fee may apply (this will be informed in advance).
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-300 pt-6">
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h4 className="font-semibold text-yellow-800">Special Note:</h4>
              <ul className="list-disc ml-6 mt-2 space-y-1 text-yellow-700">
                <li>Please ensure the item is properly packed to avoid damage during transit (if applicable).</li>
                <li>Our team reserves the right to reject a return if the item does not meet return policy conditions.</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-300 pt-6 text-sm text-gray-600">
            <p className="font-semibold">"www.adventureaxis.in" is a registered trade mark.</p>
            <p>PAN Number: AAKCA0262D</p>
            <p>GST Registration Number: 05AAKCA0262D1Z8</p>
            <p>Working Hours: 9:30 - 18:30 pm</p>
            <p className="font-semibold mt-2">Adventure Axis Equipments (Pvt.) Ltd.</p>
            <p>Address: 162, Badrinath Road (Opp. Divine Lakshmi Ganga Hotel)</p>
            <p>Tapovan Luxman Jhoola, RISHIKESH-249 192 (UK)</p>
            <p>Ph.: +91-135-2442822 | Mo.: 7669280002, 9897468886</p>
            <p>E-mail: <a href="mailto:info@adventureaxis.in" className="text-blue-600 hover:underline">info@adventureaxis.in</a> / <a href="mailto:nitin.rksh@gmail.com" className="text-blue-600 hover:underline">nitin.rksh@gmail.com</a></p>
            <p>Visit us at: <a href="https://www.adventureaxis.in" className="text-blue-600 hover:underline">www.adventureaxis.in</a></p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default ReturnPolicy