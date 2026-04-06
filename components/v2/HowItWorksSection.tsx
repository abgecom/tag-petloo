"use client"

export default function HowItWorksSection() {
  return (
    <div className="py-20 px-6 md:px-12 -mx-4" style={{ backgroundColor: "#F1E9DB" }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-3xl md:text-5xl font-bold text-black mb-4 font-sans">
              Como funciona a tag Petloo?{" "}
            </h2>
            <p className="text-lg md:text-xl text-black mb-6">
              {
                "Você recebe em sua casa a tag rastreadora e se cadastra no app Petloo. Dentro do app você conecta a sua tag única com os dados do seu Pet e a partir dai, você já consegue localiza-lo. "
              }
            </p>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  1
                </span>
                <p className="text-gray-700">Receba sua Tag personalizada em casa</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  2
                </span>
                <p className="text-gray-700">Baixe o app Petloo e cadastre seu pet</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  3
                </span>
                <p className="text-gray-700">Coloque a Tag na coleira e tenha segurança total</p>
              </div>
            </div>
          </div>
          <div className="flex-1">
            <div className="w-full h-[400px] md:h-[500px] bg-gray-200 rounded-2xl flex items-center justify-center">
              <img
                src="https://5txjuxzqkryxsbyq.public.blob.vercel-storage.com/LP%20looneca/Tag%20rastreamento/video%20para%20gif%20petloo.gif"
                alt="Como funciona o kit Petloo"
                className="w-full h-full object-cover rounded-2xl"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
