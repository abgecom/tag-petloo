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
          A cada 3 minutos 1 pet desaparece no Brasil segundo ONG Ampara Animal. Dor e desespero de encontrar novamente
          são devastadores
        </h1>

        {/* Subtitle/Lead */}
        <p className="text-gray-700 text-lg md:text-xl leading-relaxed mb-6 max-w-5xl mx-auto text-left">
          E nessa angústia, o tempo vira inimigo: segundo dados da Associação de Proteção aos Animais do Brasil, as
          chances de reencontrar um pet caem mais de 50% após as primeiras 12 horas isso porque, sem noção de que estão
          perdidos, eles continuam caminhando para cada vez mais longe. Foi pensando nisso que nasceu a campanha de
          distribuição gratuita da Tag de Rastreamento Petloo: para que você e seu pet nunca façam parte dessa
          estatística. Fique até o final e veja como participar.
        </p>

        {/* Author and Date */}
        <div className="mb-8">
          <p className="text-gray-800 font-medium text-lg">Por Renan Freitas de Andrade</p>
          <p className="text-gray-600 text-sm mt-1">15/07/2025 09h17 – Atualizado há duas horas</p>
        </div>

        {/* Main Hero Image */}
        <div className="mb-6">
          <img
            src="https://5txjuxzqkryxsbyq.public.blob.vercel-storage.com/LP%20looneca/Tag%20rastreamento/Advertorial%202/adv2-1.png"
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
            Cuidado nem sepre é garantia: por que tantos pets seguros acabam desaparecendo?
          </h2>
          <p className="text-gray-700 text-lg leading-relaxed mb-6">
            Muitos tutores acreditam que a possibilidade de perder um pet seja remota, especialmente aqueles que tomam
            todas as precauções possíveis. Afinal, o animal que mora em apartamento, que sai apenas para passeios breves
            ou está sempre preso à coleira parece distante desse tipo de risco.
          </p>

          <p className="text-gray-700 text-lg leading-relaxed mb-6">
            No entanto, histórias de desaparecimento mostram justamente o contrário: basta um único momento inesperado
            para que tudo saia do controle.
          </p>

          <p className="text-gray-700 text-lg leading-relaxed mb-6">
            Foi exatamente isso que aconteceu com Carol, tutora do cãozinho Thor, conhecido por seu comportamento
            tranquilo e por viver em um apartamento sem acesso direto à rua. Durante um passeio rotineiro, Thor
            assustou-se com um barulho de um rojão estourando e, em questão de segundos, escapou da guia e correu pela
            rua, desorientado e assustado.
          </p>

          <p className="text-gray-700 text-lg leading-relaxed mb-6">
            Carol descreve o sentimento vivido por ela naquele momento como algo devastador:
          </p>

          <blockquote className="bg-gray-50 border-l-4 border-gray-300 p-6 mb-8">
            <p className="text-gray-700 text-lg leading-relaxed italic mb-4">
              "É um desespero que não dá para explicar. Você chama, procura pelas ruas, publica nas redes sociais,
              espalha cartazes… Mas a dor de não saber onde ele está — se está com fome, assustado ou machucado —
              simplesmente corrói por dentro."
            </p>
            <footer className="text-gray-600 font-medium">— Carol, tutora do Thor</footer>
          </blockquote>

          <p className="text-gray-700 text-lg leading-relaxed mb-6">
            Relatos como o de Carol não são casos isolados e revelam uma dura realidade: a segurança dos pets nunca está
            garantida, independentemente das medidas de proteção adotadas pelos tutores. Momentos inesperados, breves
            descuidos ou simples acontecimentos do dia a dia podem se transformar em situações críticas.
          </p>

          <p className="text-gray-700 text-lg leading-relaxed mb-8">
            Por isso, antecipar-se ao problema torna-se essencial. Proteger um pet antes que ele se perca é uma atitude
            não só responsável, mas indispensável.
          </p>

          {/* Veterinarian Image */}
          <div className="mb-8">
            <img
              src="https://5txjuxzqkryxsbyq.public.blob.vercel-storage.com/LP%20looneca/Tag%20rastreamento/Advertorial%202/adv2-2.png"
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
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
            {"Sobre a campanha Pet Seguro da Petloo e custos para receber sua tag"} 
          </h2>

          <div className="space-y-4 mb-8">
            <p className="text-gray-700 text-lg leading-relaxed">
              Depois de entender a gravidade do problema, é fundamental conhecer soluções reais e eficazes para
              evitá-lo. Uma delas, que vem ganhando destaque pela eficiência e simplicidade, é a Tag de Rastreamento da
              Petloo. Trata-se de uma tecnologia acessível, fácil de usar e extremamente eficiente no momento crítico em
              que um pet é perdido.
            </p>

            <p className="text-gray-700 text-lg leading-relaxed">
              Graças à essa tecnologia simples e eficiente, milhares de pets já foram reencontrados rapidamente,
              poupando seus tutores da angústia da perda definitiva.
            </p>

            <p className="text-gray-700 text-lg leading-relaxed">
            E para ter acesso à essa tecnologia de ponta desenvolvida aqui mesmo no Brasil, o único valor a ser cobrado é o do envio, este envio é feito através de uma modalidade especial pois o produto deve chegar intacto. Nada mais justo pois o produto estará saindo de graça.
            </p>

          </div>

          {/* Product Demo Image */}
          <div className="mb-8">
            <img
              src="https://5txjuxzqkryxsbyq.public.blob.vercel-storage.com/LP%20looneca/Tag%20rastreamento/Advertorial%202/adv2-3.png"
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
            Como a Tag Petloo utiliza a tecnologia GPS para localizar o pet em tempo real
          </h2>

          <p className="text-gray-700 text-lg leading-relaxed mb-8">
            A tecnologia por trás da Tag Petloo é simples, porém altamente eficiente: Basta prender a tag na coleira do
            pet. Caso ele desapareça, você abre o aplicativo Petloo no seu celular e visualiza imediatamente a
            localização exata dele via GPS, em tempo real.
          </p>

          <div className="mb-8">
            <p className="text-gray-700 text-lg leading-relaxed mb-4">O funcionamento é assim:</p>

            <div className="space-y-4 mb-8">
              <div>
                <h4 className="text-lg font-bold text-gray-900 mb-2">1 - Registro do Pet no App Petloo:</h4>
                <p className="text-gray-700 text-lg leading-relaxed">
                  O tutor coloca a tag diretamente na coleira do pet. Ela é pequena, leve e confortável, ideal para cães
                  e gatos de todos os tamanhos.
                </p>
              </div>

              <div>
                <h4 className="text-lg font-bold text-gray-900 mb-2">2 - Rastreamento via GPS:</h4>
                <p className="text-gray-700 text-lg leading-relaxed">
                  Caso o pet desapareça ou saia de sua área de segurança definida, o tutor pode imediatamente acessar o
                  aplicativo Petloo em seu celular. A partir daí, o sistema utiliza o GPS integrado na tag para exibir
                  em tempo real a localização exata do pet em um mapa detalhado.
                </p>
              </div>

              <div>
                <h4 className="text-lg font-bold text-gray-900 mb-2">3 - Notificação Imediata e QR Code:</h4>
                <p className="text-gray-700 text-lg leading-relaxed">
                  Além disso, qualquer pessoa que encontre o pet pode escanear o QR Code diretamente com a câmera do
                  celular. O tutor receberá uma notificação instantânea com a localização precisa e detalhes para
                  contato, aumentando ainda mais as chances de um reencontro rápido.
                </p>
              </div>
            </div>

            <p className="text-gray-700 text-lg leading-relaxed font-semibold">
              O grande diferencial está justamente nessa combinação: GPS preciso com um QR Code prático e universal.
            </p>
          </div>

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
              src="https://5txjuxzqkryxsbyq.public.blob.vercel-storage.com/LP%20looneca/Tag%20rastreamento/Advertorial%202/adv2-4.png"
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
            Como faço para receber minha tag?
          </h2>

          <div className="space-y-4 mb-8">
            <p className="text-gray-700 text-lg leading-relaxed">
              Em contato com a Petloo, fomos informados que <strong>restam menos de 20 unidades disponíveis</strong>{" "}
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
