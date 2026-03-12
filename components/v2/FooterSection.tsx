"use client"

export default function FooterSection() {
  return (
    <footer className="border-t border-gray-300 pt-8 mt-12">
      <div className="text-center space-y-6">
        <div>
          <img
            src="https://5txjuxzqkryxsbyq.public.blob.vercel-storage.com/LP%20looneca/Tag%20rastreamento/Petloosemfundo%202-wiHpYOGK6l8BekDtGwMXaJxrq0maQN.png"
            alt="Petloo Logo"
            className="h-16 mx-auto"
          />
        </div>
        <div className="flex justify-center gap-8 text-sm">
          <a href="#" className="text-black hover:underline">
            Termos de Uso
          </a>
          <a href="#" className="text-black hover:underline">
            Política de Privacidade
          </a>
        </div>
        <div className="text-sm text-black">© 2025 Petloo – Todos os direitos reservados</div>
      </div>
    </footer>
  )
}
