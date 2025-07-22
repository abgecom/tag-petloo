"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function AdvertorialB() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header G1 PETS */}
      <div className="bg-red-600 text-white py-3 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mt-2">
            <h1 className="text-3xl font-bold"> PETS</h1>
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Main Title */}
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-8 leading-tight text-left">
          A cada 3 minutos 1 pet desaparece no Brasil segundo ONG Ampara Animal. Dor e desespero de encontrar novamente são devastadores                 
        </h1>

        {/* Subtitle/Lead */}
        <p className="text-gray-700 text-lg md:text-xl leading-relaxed mb-6 max-w-5xl mx-auto text-left">
          A Tag Localizadora Petloo promete ajudar tutores a encontrarem seus animais perdidos com tecnologia e conexão
          via app. A distribuição de tags gratuitas faz parte da campanha de proteção e rastreamento animal da empresa.
          Fique até o final que mostraremos como participar dessa campanha e{" "}
          <strong>garantir sua tag gratuitamente</strong>.
        </p>

        {/* Author and Date */}
        <div className="mb-8">
          <p className="text-gray-800 font-medium text-lg">Por Renan Freitas de Andrade</p>
          <p className="text-gray-600 text-sm mt-1">15/07/2025 09h17 – Atualizado há duas horas</p>
        </div>

        {/* Main Hero Image */}
        <div className="mb-6">
          <img
            src="https://5txjuxzqkryxsbyq.public.blob.vercel-storage.com/LP%20looneca/Tag%20rastreamento/Advertorial%201/advimg1.png"
            alt="Um dos maiores riscos para a segurança do seu pet é o desaparecimento repentino — e a falta de identificação adequada."
            className="w-full h-auto rounded-lg shadow-lg"
          />
          <p className="text-gray-500 text-sm text-center mt-3 italic max-w-4xl mx-auto">
            Um dos maiores riscos para a segurança do seu pet é o desaparecimento repentino — e a falta de identificação
            adequada.
          </p>
        </div>

        {/* Statistics Section */}
        <div className="mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
            Você sabe o que acontece quando um pet se perde?
          </h2>
          <p className="text-gray-700 text-lg leading-relaxed mb-6">
            Hoje, no Brasil, mais de <strong>30 milhões de cães e gatos vivem abandonados ou perdidos</strong>. Segundo
            dados do instituto Pet Brasil, <strong>1 animal se perde a cada 3 minutos no país</strong>
          </p>

          <h3 className="text-xl font-bold text-gray-900 mb-4">E você sabe o que acontece com a maioria?</h3>
          <ul className="space-y-3 mb-8">
            <li className="flex items-start">
              <span className="w-2 h-2 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              <span className="text-gray-700 text-lg">Menos de 10% são encontrados.</span>
            </li>
            <li className="flex items-start">
              <span className="w-2 h-2 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              <span className="text-gray-700 text-lg">Muitos acabam atropelados ou doentes</span>
            </li>
            <li className="flex items-start">
              <span className="w-2 h-2 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              <span className="text-gray-700 text-lg">
                Outros, infelizmente, vão parar nas ruas ou abrigos, vivendo com medo e fome
              </span>
            </li>
          </ul>

          {/* Veterinarian Image */}
          <div className="mb-8">
            <img
              src="https://5txjuxzqkryxsbyq.public.blob.vercel-storage.com/LP%20looneca/Tag%20rastreamento/Advertorial%201/advimg2.jpg"
              alt="Veterinário examinando cachorro"
              className="w-full max-w-2xl mx-auto h-auto rounded-lg shadow-md"
            />
          </div>
        </div>

        {/* Expert Quote */}
        <div className="mb-12">
          <blockquote className="bg-gray-50 border-l-4 border-gray-300 p-6 mb-8">
            <p className="text-gray-700 text-lg leading-relaxed italic mb-4">
              "Infelizmente, o desaparecimento de cães e gatos é mais comum do que se imagina. Animais assustados com
              barulhos ou que escapam por portões abertos podem se perder facilmente. A tag localizadora que a Petloo
              oferece é uma ferramenta essencial para garantir que, caso isso aconteça, o reencontro seja rápido e
              seguro. É uma solução que traz tranquilidade para os tutores e mais segurança para os pets."
            </p>
            <footer className="text-gray-600 font-medium">— Dr. Carlos Jorge Frisso, Médico Veterinário</footer>
          </blockquote>
        </div>

        {/* Divider */}
        <hr className="border-gray-300 mb-12" />

        {/* Petloo Solution Section */}
        <div className="mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">Por que a Petloo criou essa campanha?</h2>

          <div className="space-y-4 mb-8">
            <p className="text-gray-700 text-lg leading-relaxed">
              Nosso objetivo é claro: <strong>reduzir o número de pets desaparecidos no Brasil</strong>.
            </p>
            <p className="text-gray-700 text-lg leading-relaxed">
              E acreditamos que a tecnologia pode ajudar. Por isso, desenvolvemos a{" "}
              <strong>Tag Localizadora Petloo</strong>.
            </p>
            <p className="text-gray-700 text-lg leading-relaxed">
              Uma solução simples e acessível que pode fazer{" "}
              <strong>toda a diferença entre reencontrar seu pet... ou não</strong>
            </p>
          </div>

          {/* Product Demo Image */}
          <div className="mb-8">
            <img
              src="https://5txjuxzqkryxsbyq.public.blob.vercel-storage.com/LP%20looneca/Tag%20rastreamento/Advertorial%201/advimg3.png"
              alt="Tag localizadora Petloo ao lado de smartphone mostrando localização do pet no mapa"
              className="w-full max-w-4xl mx-auto h-auto rounded-lg shadow-lg"
            />
          </div>
        </div>

        {/* How It Works Section */}
        <div className="mb-12">
          {/* Caption for previous image */}
          <p className="text-gray-500 text-sm text-center mb-8 italic">Imagem ilustrativa da Tag</p>

          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
            Como a Tag Localizadora Petloo funciona?
          </h2>

          <p className="text-gray-700 text-lg leading-relaxed mb-8">
            Basta prender a tag na coleira do pet. O QR code + chip interno armazena os dados de contato. Ao ser
            escaneada por qualquer celular, você recebe um alerta com a localização do pet. É à prova d'água e
            resistente a impactos. Simples, discreta e pode salvar a vida do seu melhor amigo.
          </p>

          {/* Woman with Pet Image */}
          <div className="mb-8">
            <img
              src="https://5txjuxzqkryxsbyq.public.blob.vercel-storage.com/LP%20looneca/Tag%20rastreamento/Advertorial%201/advimg4.png"
              alt="Tutora cuidando do seu pet"
              className="w-full max-w-4xl mx-auto h-auto rounded-lg shadow-lg"
            />
          </div>
        </div>

        {/* Campaign Details Section */}
        <div className="mb-12">
          {/* Caption for previous image */}
          <p className="text-gray-500 text-sm text-center mb-8 italic">
            Com alguns passos simples, é possível cadastrar a tag do pet.
          </p>

          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">Sobre a campanha</h2>

          <div className="space-y-4 mb-8">
            <p className="text-gray-700 text-lg leading-relaxed">
              A Petloo está disponibilizando <strong>300 unidades da Tag Localizadora</strong>, sem custo de aquisição,
              para tutores que se preocupam com a segurança do seus pets.
            </p>
            <p className="text-gray-700 text-lg leading-relaxed">
              O valor pago é apenas o frete, que é um <strong>frete especial</strong>, pois a tag contém componentes
              eletrônicos e sistema de ativação.
            </p>
            <p className="text-gray-700 text-lg leading-relaxed">
              <strong>Atenção:</strong> Essa ação tem como objetivo popularizar o uso da tecnologia para reduzir os
              casos de abandono e fuga, e uma parte do valor do envio será destinado a{" "}
              <strong>ONGs que resgatam animais de rua</strong>.
            </p>
          </div>

          <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">Por que confiar na tag Petloo?</h3>

          <ul className="space-y-4 mb-8">
            <li className="flex items-start">
              <span className="w-2 h-2 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              <span className="text-gray-700 text-lg">
                Mais de 6 mil pets já foram encontrados graças a tags e coleiras de identificação
              </span>
            </li>
            <li className="flex items-start">
              <span className="w-2 h-2 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              <span className="text-gray-700 text-lg">
                Desenvolvida com tecnologia segura e sem necessidade de bateria
              </span>
            </li>
            <li className="flex items-start">
              <span className="w-2 h-2 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              <span className="text-gray-700 text-lg">Produzida no Brasil por quem entende de amor animal.</span>
            </li>
          </ul>

          <p className="text-gray-700 text-lg leading-relaxed mb-8">
            E o melhor: <strong>disponível exclusivamente pelo site oficial da Petloo</strong>.
          </p>

          {/* Person with Pet Image */}
          <div className="mb-8">
            <img
              src="https://5txjuxzqkryxsbyq.public.blob.vercel-storage.com/LP%20looneca/Tag%20rastreamento/Advertorial%201/advimg5.png"
              alt="Tutor cuidando carinhosamente do seu pet"
              className="w-full max-w-4xl mx-auto h-auto rounded-lg shadow-lg"
            />
          </div>
        </div>

        {/* Final CTA Section */}
        <div className="mb-16">
          {/* Caption for previous image */}
          <p className="text-gray-500 text-sm text-center mb-8 italic">Segurança e proteção para os Pets</p>

          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
            Como faço para garantir minha tag grátis?
          </h2>

          <div className="space-y-4 mb-8">
            <p className="text-gray-700 text-lg leading-relaxed">
              Em contato com a Petloo, fomos informados que <strong>restam menos de 300 unidades disponíveis</strong>{" "}
              para essa campanha.
            </p>
            <p className="text-gray-700 text-lg leading-relaxed">
              O custo é <strong>apenas o valor do envio</strong>, e como mencionado, uma parte será doada para resgates
              e castrações de animais em situação de rua.
            </p>
            <p className="text-gray-700 text-lg leading-relaxed">
              Ou seja:{" "}
              <strong>você protege o seu melhor amigo e ainda ajuda outros que ainda esperam por um lar</strong>.
            </p>
          </div>

          {/* CTA Button */}
          <div className="text-center mb-8">
            <Link href="https://tag.petloo.com.br/">
              <Button className="bg-red-500 hover:bg-red-600 text-white px-8 py-4 text-lg font-bold rounded-md shadow-lg transition-colors">
                CLIQUE AQUI PARA GARANTIR SUA TAG GRÁTIS
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-700 text-white py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center space-y-4">
            {/* Footer Links */}
            <div className="text-sm">
              <span className="text-gray-300">
                Rastrear pedido / Perguntas frequentes / Contato / Termos de envios e entregas
              </span>
            </div>

            {/* Copyright */}
            <div className="text-sm">
              <span className="text-gray-300">Copyright @ 2022</span>
            </div>

            {/* CNPJ */}
            <div className="text-sm">
              <span className="text-gray-300">13.470.421/0001-28</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
