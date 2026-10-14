// components/landing/TarjetaSlide.jsx
// Tarjeta de las secciones-slide del landing (Servicios, Sedes, Horarios)
// desde lg: el mismo vidrio claro que el boton "Conoce nuestros servicios" y
// que la pildora de la topbar en el landing.
export function TarjetaSlide({ children, ultima = false }) {
  return (
    <div className={`${ultima ? 'slide-card-ultima' : 'slide-card'} lg:flex lg:flex-1 lg:flex-col lg:rounded-t-[2rem] lg:border-x lg:border-t lg:border-slate-300/25 lg:bg-white/12 lg:bg-[linear-gradient(to_bottom,rgb(255_255_255/0.18),transparent_30%)] lg:px-10 lg:py-8 lg:shadow-[0_-24px_60px_-30px_rgb(0_0_0/0.45),inset_0_1px_0_rgb(226_232_240/0.3)] lg:backdrop-blur-[12px] lg:backdrop-saturate-150 lg:backdrop-brightness-[.75]`}>
      {children}
    </div>
  );
}
