import { Star } from "lucide-react"
import Image from "next/image"

export default function SocialProofSectionV2() {
  return (
    <section className="py-4 md:py-5 bg-white border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12 md:gap-16">
          
          {/* App Store & Play Store */}
          <div className="flex flex-col items-center gap-1.5">
            <div className="flex items-center gap-3">
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Apple_Store-2lLkKW2aqKH9dY6B8WTQjy9prOlmyj.png"
                alt="Apple Store"
                width={80}
                height={24}
                className="h-4 md:h-5 w-auto"
              />
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Google_Play_2022_logo.svg-MMNPJjaH17jds5WnNcgSsbkC0zXBkw.png"
                alt="Google Play"
                width={90}
                height={24}
                className="h-4 md:h-5 w-auto"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">4.9/5 | App Store & Play Store</span>
            </div>
          </div>

          {/* Divider - desktop only */}
          <div className="hidden sm:block w-px h-4 bg-border" />

          {/* Reclame Aqui RA1000 */}
          <div className="flex items-center">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/imagens_blog_800x600-5-EjszK0QNgRsF7nHUEoYTDvkc4nBp37.webp"
              alt="Certificado RA1000 Reclame Aqui"
              width={200}
              height={80}
              className="h-16 md:h-20 w-auto mix-blend-multiply"
            />
          </div>

          {/* Divider - desktop only */}
          <div className="hidden sm:block w-px h-4 bg-border" />

          {/* Pets protegidos */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-petloo-purple" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
              <span className="text-xs font-semibold text-foreground">+100.000</span>
            </div>
            <span className="text-xs text-muted-foreground">Pets protegidos em todo o Brasil</span>
          </div>

        </div>
      </div>
    </section>
  )
}
