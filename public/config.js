/*
 * Configuración de la tienda Monatekeda.
 * Puedes editar este archivo directamente en el servidor (cPanel → Administrador
 * de archivos) sin volver a compilar. Deja un valor vacío ('') para usar el
 * valor con el que se compiló la tienda.
 */
window.STORE_CONFIG = {
  // Número de WhatsApp para pedidos: código de país + número, sin "+" ni espacios.
  // Ejemplo: '51987654321'. Mientras esté vacío, el botón de WhatsApp no aparece.
  whatsappNumber: '51912968105',

  // URL de la API pública de la tienda.
  apiBaseUrl: 'https://monatekeda.app.noinventes.com/api/store',

  storeName: 'Monatekeda',
  storeTagline: 'Artesanía y souvenirs peruanos',

  // Redes sociales (se muestran en la portada). Ejemplo: 'instagram.com/monatekeda'.
  // Mientras estén vacías, el ícono aparece atenuado y sin enlace.
  // WhatsApp usa el número de arriba.
  instagramUrl: '',
  facebookUrl: '',
  tiktokUrl: '',
}
