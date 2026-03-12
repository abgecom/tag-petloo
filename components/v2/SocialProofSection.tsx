"use client"

export default function SocialProofSection() {
  return (
    <div className="text-center space-y-6">
      <div className="inline-flex items-center gap-2 bg-white px-6 py-3 rounded-full shadow-sm border border-gray-200">
        <span className="text-gray-800 font-medium">Mais 100 mil Pets seguros em todo Brasil</span>
        <div className="flex items-center gap-1">
          <span className="text-yellow-400">⭐⭐⭐⭐⭐</span>
          <span className="text-gray-700 font-semibold ml-1">4,8/5</span>
        </div>
      </div>
      <div className="max-w-2xl mx-auto">
        <img
          src="https://5txjuxzqkryxsbyq.public.blob.vercel-storage.com/LP%20looneca/Tag%20rastreamento/20250710_1202_Tinoco%20e%20Tecnologia_simple_compose_01jztdnj16eeprx5w1snhshss3.png"
          alt="Prova social - Pets seguros com Petloo"
          className="w-full h-auto rounded-lg shadow-md"
        />
      </div>
    </div>
  )
}
