from datetime import date
from fpdf import FPDF


class PDF(FPDF):
    def header(self):
        self.set_font("Helvetica", "B", 14)
        self.cell(0, 10, self.title_text, new_x="LMARGIN", new_y="NEXT")
        self.set_font("Helvetica", "", 10)
        self.set_text_color(100, 100, 100)
        self.cell(
            0,
            8,
            f"Proyecto: DashboardNeura | Fecha: {date.today().isoformat()}",
            new_x="LMARGIN",
            new_y="NEXT",
        )
        self.set_draw_color(200, 200, 200)
        self.line(10, self.get_y(), 200, self.get_y())
        self.ln(6)
        self.set_text_color(0, 0, 0)

    def add_section(self, title: str, body: str):
        self.set_font("Helvetica", "B", 12)
        self.multi_cell(0, 8, title)
        self.ln(1)
        self.set_font("Helvetica", "", 11)
        self.multi_cell(0, 7, body)
        self.ln(4)


def crear_pdf(path: str, title: str, sections: list[tuple[str, str]]):
    pdf = PDF()
    pdf.title_text = title
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()

    for section_title, section_body in sections:
        pdf.add_section(section_title, section_body)

    pdf.output(path)


if __name__ == "__main__":
    tecnico = [
        (
            "1) Arquitectura y stack",
            (
                "DashboardNeura fue construido con Next.js (App Router), React y "
                "TypeScript, con estilos en TailwindCSS v4. El proyecto usa una "
                "arquitectura modular por rutas para escalar funciones SaaS."
            ),
        ),
        (
            "2) Estructura de modulos",
            (
                "Se implemento un layout compartido tipo SaaS en app/(saas)/layout.tsx "
                "con sidebar de navegacion y rutas de modulo: /dashboard, /stock, "
                "/usuarios y /empresas. Cada modulo tiene su pagina inicial."
            ),
        ),
        (
            "3) Integracion con Supabase",
            (
                "Se agrego @supabase/supabase-js y un helper en lib/supabase.ts para "
                "crear el cliente usando NEXT_PUBLIC_SUPABASE_URL y "
                "NEXT_PUBLIC_SUPABASE_ANON_KEY. Se incluye .env.example para configurar "
                "variables de entorno local y en Vercel."
            ),
        ),
        (
            "4) Frontend base y UX inicial",
            (
                "La pagina principal (/) se adapto como landing operativa del sistema, "
                "con accesos directos a Dashboard y Empresas. El diseno usa componentes "
                "simples con clases utilitarias de Tailwind para permitir evolucion rapida."
            ),
        ),
        (
            "5) Calidad y validacion",
            (
                "Se ejecuto ESLint sin errores tras los cambios. La base queda preparada "
                "para extender autenticacion, RBAC por empresa, sincronizacion con "
                "e-commerce y despliegue continuo en Vercel."
            ),
        ),
        (
            "6) Recomendaciones tecnicas siguientes",
            (
                "Implementar auth completa con Supabase, tablas companies/profiles/roles/"
                "company_modules, politicas RLS, middleware de sesion en Next.js y "
                "pipeline CI/CD con GitHub + Vercel."
            ),
        ),
    ]

    informativo = [
        (
            "Que es DashboardNeura",
            (
                "DashboardNeura es una plataforma SaaS pensada para administrar "
                "empresas y operaciones de tiendas online desde un unico panel."
            ),
        ),
        (
            "Que se construyo",
            (
                "Se dejo lista una base funcional del sistema con cuatro areas clave: "
                "Dashboard, Stock, Usuarios y Empresas."
            ),
        ),
        (
            "Para que sirve cada modulo",
            (
                "- Dashboard: vista general del negocio y su actividad.\n"
                "- Stock: control de inventario de productos.\n"
                "- Usuarios: gestion de personas y permisos.\n"
                "- Empresas: alta y configuracion de lo que cada empresa puede ver."
            ),
        ),
        (
            "Como se conecta a la nube",
            (
                "El proyecto esta preparado para usar Supabase (base de datos y login) y "
                "para desplegarse en Vercel conectado a un repositorio de GitHub."
            ),
        ),
        (
            "Beneficio inmediato",
            (
                "Ya tienes una estructura profesional para seguir creciendo el sistema sin "
                "partir desde cero, con tecnologia moderna y escalable."
            ),
        ),
    ]

    crear_pdf(
        "E:/DashboardNeura/docs/DashboardNeura_Tecnico.pdf",
        "Documento Tecnico - DashboardNeura",
        tecnico,
    )
    crear_pdf(
        "E:/DashboardNeura/docs/DashboardNeura_Informativo.pdf",
        "Documento Informativo - DashboardNeura",
        informativo,
    )
