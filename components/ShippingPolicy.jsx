import React from 'react'

const ShippingPolicy = () => {
  return (
    <section className="bg-[#fffaf3] py-10 px-4 md:px-12 w-full mx-auto rounded-lg shadow-sm">
      <div className="border border-black p-4 rounded-xl shadow-sm">
        <h2 className="text-3xl font-bold mb-6 text-start">Our Shipping Policy</h2>
        <p className="mb-4">
          <span className="font-semibold">www.adventureaxis.in (Website)</span> (“we”, “our”, “us”) To ensure ease of selling and the best possible customer experience, we mandate delivery to all customers via our logistics partners and deduct the shipping cost from the selling price before making a payment to you. Shipping fee is calculated on actual weight or volumetric weight, whichever is higher. This is to account for items which are lightweight but occupy a lot of shipping space.
        </p>
        <div className="space-y-5">
          <div>
            <strong>1. Delivery charge varies with each Seller :-</strong>
            <p className="text-justify mt-1">
              Sellers incur relatively higher shipping costs on low value items. In such cases, charging a nominal delivery charge helps them offset logistics costs. Please check your order summary to understand the delivery charges for individual products.<br />
              For Products listed as www.adventureaxis.in (E Commerce Website Of Adventure Axis), a Rs 200 charge for delivery per item may be applied if the order value is less than Rs 1,000=00 to 2,000=00. While, orders of Rs 10,000=00 or above are delivered free based on delivery partner's fee.
            </p>
          </div>
          <div>
            <strong>2. Why does the delivery date not correspond to the delivery timeline of X-Y business days? :-</strong>
            <p className="text-justify mt-1">
              It is possible that the Seller or our courier partners have a holiday between the day your placed your order and the date of delivery, which is based on the timelines shown on the product page. In this case, we add a day to the estimated date. Some courier partners and Sellers do not work on Sundays and this is factored in to the delivery dates.
            </p>
          </div>
          <div>
            <strong>3. What is the estimated delivery time? :-</strong>
            <p className="text-justify mt-1">
              Sellers generally procure and ship the items within the time specified on the product page. Business days exclude public holidays and Sundays.<br />
              Estimated delivery time depends on the following factors:
            </p>
            <ul className="list-disc pl-6 mt-1">
              <li>The Seller offering the product</li>
              <li>Product's availability with the Seller</li>
              <li>The destination to which you want the order shipped to and location of the Seller.</li>
            </ul>
          </div>
          <div>
            <strong>4. Are there any hidden costs (sales tax, octroi etc) on items sold by Sellers on www.adventureaxis.in? :-</strong>
            <p className="text-justify mt-1">
              There are NO hidden charges when you make a purchase on www.adventureaxis.in. List prices are final and all-inclusive. The price you see on the product page is exactly what you would pay.<br />
              Delivery charges are not hidden charges and are charged (if at all) extra depending on the Seller's shipping policy.
            </p>
          </div>
          <div>
            <strong>5. Why does the estimated delivery time vary for each seller? :-</strong>
            <p className="text-justify mt-1">
              You have probably noticed varying estimated delivery times for sellers of the product you are interested in. Delivery times are influenced by product availability, geographic location of the Seller, your shipping destination and the courier partner's time-to-deliver in your location.<br />
              Please enter your default pin code on the product page (you don't have to enter it every single time) to know more accurate delivery times on the product page itself.
            </p>
          </div>
          <div>
            <strong>6. Seller does not/cannot ship to my area. Why? :-</strong>
            <p className="text-justify mt-1">
              Please enter your pincode on the product page (you don't have to enter it every single time) to know whether the product can be delivered to your location.  If you haven't provided your pincode until the checkout stage, the pincode in your shipping address will be used to check for serviceability.<br />
              Whether your location can be serviced or not depends on:<br />
              1 )- Whether the Seller ships to your location<br />
              2 )- Legal restrictions, if any, in shipping particular products to your location
            </p>
          </div>

          {/* Additional Shipping Policy Points 7-11 */}
          <div className="space-y-5">
            <div>
              <p className="text-justify" style={{ textAlign: 'justify' }}><b>7. Why is the COD option not offered in my location? :-</b>
                Availability of COD depends on the ability of our courier partner servicing your location to accept cash as payment at the time of delivery.<br />
                Our courier partners have limits on the cash amount payable on delivery depending on the destination and your order value might have exceeded this limit.  Please enter your pin code on the product page to check if COD is available in your location.
              </p>
            </div>
            <div>
              <p className="text-justify" style={{ textAlign: 'justify' }}><b>8. I need to return an item, how do I arrange for a pick-up? :- </b>
                Returns are easy. Contact Us to initiate a return. You will receive a call explaining the process, once you have initiated a return.<br />
                Wherever possible www.adventureaxis.in (E Commerce Website Of Adventure Axis) delivery partner's Logistics will facilitate the pick-up of the item. In case, the pick-up cannot be arranged through www.adventureaxis.in (E Commerce Website Of Adventure Axis)-delivery partner's, you can return the item through a third-party courier service. Return fees are borne by the Seller.
              </p>
            </div>
            <div>
              <p className="text-justify" style={{ textAlign: 'justify' }}><b>9. I did not receive my order but got a delivery confirmation SMS/Email. :- </b>
                In case the product was not delivered and you received a delivery confirmation email/SMS, report the issue within 7 days from the date of delivery confirmation for the seller to investigate.
              </p>
            </div>
            <div>
              <p className="text-justify" style={{ textAlign: 'justify' }}><b>10. What do the different tags like "In Stock", "Available" mean? :- </b><br />
                <strong>'In Stock' </strong>
                For items listed as "In Stock", Sellers will mention the delivery time based on your location pincode (usually 2-3 business days, 4-5 business days or 4-6 business days in areas where standard courier service is available). For other areas, orders will be sent by Registered Post through the Indian Postal Service which may take 1-2 weeks depending on the location.<br />
                <strong>'Available'</strong>
                The Seller might not have the item in stock but can procure it when an order is placed for the item. The delivery time will depend on the estimated procurement time and the estimated shipping time to your location.<br />
                <strong>'Preorder' or 'Forthcoming'</strong>
                Such items are expected to be released soon and can be pre-booked for you. The item will be shipped to you on the day of it's official release launch and will reach you in 2 to 7 business days. The Preorder duration varies from item to item. Once known, release time and date is mentioned. (Eg. 5th May, August 3rd week)<br />
                <strong>'Out of Stock'</strong>
                Currently, the item is not available for sale. Use the 'Notify Me' feature to know once it is available for purchase.<br />
                <strong>'Imported'</strong>
                Sometimes, items have to be sourced by Sellers from outside India. These items are mentioned as 'Imported' on the product page and can take at least 10 days or more to be delivered to you.<br />
                <strong>'Back In Stock Soon'</strong>
                The item is popular and is sold out. You can however 'book' an order for the product and it will be shipped according to the timelines mentioned by the Seller.<br />
                <strong>'Temporarily Unavailable'</strong>
                The product is currently out of stock and is not available for purchase. The product could to be in stock soon. Use the 'Notify Me' feature to know when it is available for purchase.<br />
                <strong>'Permanently Discontinued' </strong>
                This product is no longer available because it is obsolete and/or its production has been discontinued.<br />
                <strong>'Out of Print'</strong>
                This product is not available because it is no longer being published and has been permanently discontinued.
              </p>
            </div>
            <div>
              <p className="text-justify" style={{ textAlign: 'justify' }}><b>11. www.adventureaxis.in (E Commerce Website Of Adventure Axis) :- </b>
                is an Internet based content and e-commerce portal, a company
                incorporated under the laws of India. Use of the Website is offered to you conditioned on acceptance
                without modification of all the terms, conditions and notices contained in these Terms, as may be posted
                on the Website from time to time. www.adventureaxis.in (Website) at its sole discretion reserves the right
                not to accept a User from registering on the Website without assigning any reason thereof. provides a
                number of Internet-based services through the Web Site (all such services, collectively, the "Service").
                The products can be purchased through the Website through various methods of payments offered. The
                purchase of products shall be additionally governed by specific policies of sale, like cancellation policy,
                return policy, etc. and all of which are incorporated here by reference. In addition, these terms and
                policies may be further supplemented by www.adventureaxis.in (Website) product specific conditions,
                which may be displayed on the webpage of that product<br /> <br />
                “www.adventureaxis.in (Website) ” is a registered trade mark..<br />
                PAN Number :- AAKCA0262D <br />
                GST Registration Number :-  05AAKCA0262D1Z8  <br />
                Working Hours : 9:30 - 18:30 pm  <br />
                Adventure Axis Equipments (Pvt.) Ltd.
                <br />
                Address: 162, Badrinath Road (Opp. Divine Lakshmi Ganga Hotel)
                <br />
                Tapovan Luxman Jhoola, RISHIKESH-249 192 (UK)
                <br />
                Ph.: +91-135-2442822 | Mo.: 7669280002, 9897468886
                <br />
                E-mail : <a href="mailto:info@adventureaxis.in">info@adventureaxis.in</a> / <a href="mailto:nitin.rksh@gmail.com">nitin.rksh@gmail.com</a>
                <br />
                Visit us at : <a href="https://www.adventureaxis.in">www.adventureaxis.in</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ShippingPolicy