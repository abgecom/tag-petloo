import { Check, ShoppingCart, Shield, Truck, RotateCcw, Award } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function ProductOffer() {
  return (
    <div className="min-h-screen py-12 px-4" style={{ backgroundColor: "#F1E9DB" }}>
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Title Section */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold text-black leading-tight">Tag rastreamento + App Petloo</h1>
          <p className="text-gray-700 text-xl font-medium">Localize, registre e segure seu pet</p>
        </div>

        {/* Main Content */}
        <div className="text-center">
          <img
            src="https://5txjuxzqkryxsbyq.public.blob.vercel-storage.com/LP%20looneca/Tag%20rastreamento/Fotos%20da%20LP/Frame%208940560-EIvm6iJOyX4PH5iRHdP9ouPNNnFr7D.png"
            alt="Cachorro com tag no pescoço e mão segurando celular com mapa"
            className="w-full max-w-lg rounded-2xl mx-auto shadow-md"
          />
        </div>

        {/* CTA Button */}
        <div className="text-center">
          <Link href="/checkout">
            <Button
              className="text-white px-20 py-8 text-2xl font-bold rounded-xl shadow-lg hover:opacity-90 transition-opacity"
              style={{ backgroundColor: "#24B14C" }}
            >
              <ShoppingCart className="w-8 h-8 mr-4" />
              Pedir agora
            </Button>
          </Link>
          <p className="text-gray-600 text-sm mt-3">Cancele a qualquer momento </p>
        </div>

        {/* Terms and Checkout */}
        <div className="text-center space-y-6">
          <div className="flex items-center justify-center gap-2">
            <input type="checkbox" id="terms" className="rounded" defaultChecked />
            <label htmlFor="terms" className="text-sm text-gray-700">
              I agree to the <span className="underline">T&Cs</span> and{" "}
              <span className="underline">Privacy policy</span>
            </label>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Guaranteed safe checkout</h3>
            <div className="flex justify-center items-center gap-4">
              <img src="/placeholder.svg?height=30&width=45&text=VISA" alt="Visa" className="h-8" />
              <img src="/placeholder.svg?height=30&width=45&text=MC" alt="Mastercard" className="h-8" />
              <img src="/placeholder.svg?height=30&width=45&text=MAESTRO" alt="Maestro" className="h-8" />
              <img src="/placeholder.svg?height=30&width=45&text=PayPal" alt="PayPal" className="h-8" />
            </div>
          </div>

          {/* Guarantees - Horizontal Layout */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
            <div className="flex items-center gap-2 text-sm">
              <Award className="w-5 h-5" style={{ color: "#24B14C" }} />
              <span className="text-gray-700">Scientifically Proven</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Truck className="w-5 h-5" style={{ color: "#24B14C" }} />
              <span className="text-gray-700">Free Shipping</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <RotateCcw className="w-5 h-5" style={{ color: "#24B14C" }} />
              <span className="text-gray-700">14-Day Money Back</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Shield className="w-5 h-5" style={{ color: "#24B14C" }} />
              <span className="text-gray-700">Made in USA</span>
            </div>
          </div>
        </div>

        {/* Free Gifts Section */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-800 text-center">You will also get FREE gifts</h2>

          <div className="space-y-4 max-w-2xl mx-auto">
            {/* Gift 1 */}
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-4">
                <img
                  src="/placeholder.svg?height=80&width=60&text=Book"
                  alt="Ultimate Guide Book"
                  className="w-16 h-20 rounded"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-gray-600 line-through">$27.50</span>
                    <span
                      className="px-2 py-1 rounded text-white text-sm font-bold"
                      style={{ backgroundColor: "#24B14C" }}
                    >
                      FREE
                    </span>
                  </div>
                  <h4 className="font-semibold text-gray-800 mb-1">The Ultimate Guide to Maintain Youth</h4>
                  <div className="flex items-center gap-1">
                    <Check className="w-4 h-4" style={{ color: "#24B14C" }} />
                    <span className="text-sm font-medium" style={{ color: "#24B14C" }}>
                      YOU ARE ELIGIBLE
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Gift 2 */}
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-4">
                <img
                  src="/placeholder.svg?height=80&width=60&text=Gift"
                  alt="Secret Gift"
                  className="w-16 h-20 rounded"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-gray-600 line-through">$22.99</span>
                    <span
                      className="px-2 py-1 rounded text-white text-sm font-bold"
                      style={{ backgroundColor: "#24B14C" }}
                    >
                      FREE
                    </span>
                  </div>
                  <h4 className="font-semibold text-gray-800 mb-1">Secret gift included in your order</h4>
                  <div className="flex items-center gap-1">
                    <Check className="w-4 h-4" style={{ color: "#24B14C" }} />
                    <span className="text-sm font-medium" style={{ color: "#24B14C" }}>
                      YOU ARE ELIGIBLE
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
