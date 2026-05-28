import Link from "next/link";
import Image from "next/image";

const featuredProducts = [
  { id: 1, name: "Kids Denim Jacket", price: "Ksh 4,350", image: "https://images.unsplash.com/photo-1622290291467-0a698f0a03c6?w=400" },
  { id: 2, name: "Cotton T-Shirt Set", price: "Ksh 2,900", image: "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=400" },
  { id: 3, name: "Summer Dress", price: "Ksh 3,600", image: "https://images.unsplash.com/photo-1519238263530-099cf8d11c44?w=400" },
  { id: 4, name: "Sneakers", price: "Ksh 5,100", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400" },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-gray-50 py-16 px-6 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Watoto Fashions
        </h1>
        <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
          Quality kids clothing for every season. Comfortable, durable, and stylish.
        </p>
        <Link href="#products" className="inline-block bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition">
          Shop Now
        </Link>
      </section>

      {/* Products */}
      <section id="products" className="py-16 px-6 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Featured Products</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {featuredProducts.map((product) => (
            <div key={product.id} className="border rounded-lg overflow-hidden hover:shadow-lg transition">
              <div className="relative h-64 w-full">
                <Image 
                  src={product.image} 
                  alt={product.name} 
                  fill 
                  className="object-cover"
                  unoptimized
                />
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900">{product.name}</h3>
                <p className="text-gray-600 mt-1">{product.price}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 text-center">
        <p>© 2026 Watoto Fashions. All rights reserved.</p>
      </footer>
    </main>
  );
}