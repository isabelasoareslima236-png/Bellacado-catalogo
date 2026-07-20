import { useState, useEffect, useMemo } from 'react';
import { db } from './firebaseConfig';
import { collection, onSnapshot, addDoc, query, where } from 'firebase/firestore';
import { ShoppingBag, Plus, Minus, X, Package, MessageCircle, Heart } from 'lucide-react';

const COLORS = {
  green: '#2F3D2E',
  sage: '#A5B197',
  pink: '#E7C9C6',
  cream: '#F7EDE6',
  sand: '#DCCFC3',
};

const WHATSAPP_NUMBER = '5517999999999';

const FontImport = () => (
  <style>{`@import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&family=Poppins:wght@400;500;600;700&display=swap');
  * { box-sizing: border-box; } body { margin: 0; }`}</style>
);

function useProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'products'), where('active', '==', true));
    const unsub = onSnapshot(q, (snap) => {
      setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, () => setLoading(false));
    return unsub;
  }, []);

  return { products, loading };
}

function CartDrawer({ cart, onClose, onUpdateQty, onRemove, onCheckout, sending }) {
  const total = cart.reduce((sum, i) => sum + i.qty * i.price, 0);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(47,61,46,0.35)' }} />
      <div style={{ position: 'relative', width: '100%', maxWidth: 380, background: COLORS.cream, height: '100%', padding: 20, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontFamily: "'Dancing Script', cursive", color: COLORS.green, fontSize: 26, margin: 0 }}>Seu carrinho</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={22} color={COLORS.green} /></button>
        </div>

        {cart.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#8a8378', textAlign: 'center' }}>
            <ShoppingBag size={32} color={COLORS.sand} style={{ marginBottom: 10 }} />
            <p style={{ fontSize: 14, margin: 0 }}>Seu carrinho está vazio.</p>
          </div>
        ) : (
          <>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {cart.map((item) => (
                <div key={item.id} style={{ background: '#fff', borderRadius: 12, padding: 12, display: 'flex', gap: 10, alignItems: 'center' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 8, background: COLORS.sand, flexShrink: 0, overflow: 'hidden' }}>
                    {item.image && <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: 13, color: COLORS.green }}>{item.name}</p>
                    <p style={{ margin: '2px 0 0', fontSize: 12, color: '#8a8378' }}>R$ {item.price.toFixed(2).replace('.', ',')}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button onClick={() => onUpdateQty(item.id, item.qty - 1)} style={{ width: 24, height: 24, borderRadius: '50%', border: `1px solid ${COLORS.sand}`, background: '#fff', cursor: 'pointer' }}><Minus size={12} color={COLORS.green} /></button>
                    <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.green, minWidth: 16, textAlign: 'center' }}>{item.qty}</span>
                    <button onClick={() => onUpdateQty(item.id, item.qty + 1)} style={{ width: 24, height: 24, borderRadius: '50%', border: `1px solid ${COLORS.sand}`, background: '#fff', cursor: 'pointer' }}><Plus size={12} color={COLORS.green} /></button>
                  </div>
                  <button onClick={() => onRemove(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><X size={15} color="#c1594a" /></button>
                </div>
              ))}
            </div>
            <div style={{ borderTop: `1px solid ${COLORS.sand}`, marginTop: 16, paddingTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                <span style={{ fontWeight: 600, color: COLORS.green, fontSize: 15 }}>Total</span>
                <span style={{ fontWeight: 700, color: COLORS.green, fontSize: 17 }}>R$ {total.toFixed(2).replace('.', ',')}</span>
              </div>
              <button onClick={onCheckout} disabled={sending} style={{ width: '100%', padding: '13px', borderRadius: 12, border: 'none', background: '#25D366', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: sending ? 0.7 : 1 }}>
                <MessageCircle size={18} /> {sending ? 'Enviando...' : 'Enviar pedido pelo WhatsApp'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const { products, loading } = useProducts();
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [sending, setSending] = useState(false);

  const categories = useMemo(() => {
    const cats = [...new Set(products.map((p) => p.category).filter(Boolean))];
    return ['Todos', ...cats];
  }, [products]);

  const filtered = activeCategory === 'Todos' ? products : products.filter((p) => p.category === activeCategory);

  const addToCart = (product) => {
    setCart((c) => {
      const existing = c.find((i) => i.id === product.id);
      if (existing) return c.map((i) => (i.id === product.id ? { ...i, qty: i.qty + 1 } : i));
      return [...c, { ...product, qty: 1 }];
    });
  };

  const updateQty = (id, qty) => {
    if (qty <= 0) return setCart((c) => c.filter((i) => i.id !== id));
    setCart((c) => c.map((i) => (i.id === id ? { ...i, qty } : i)));
  };

  const removeItem = (id) => setCart((c) => c.filter((i) => i.id !== id));
  const cartCount = cart.reduce((sum, i) => sum + i.qty, 0);

  const checkout = async () => {
    setSending(true);
    const total = cart.reduce((sum, i) => sum + i.qty * i.price, 0);
    const lines = cart.map((i) => `• ${i.qty}x ${i.name} — R$ ${(i.qty * i.price).toFixed(2).replace('.', ',')}`).join('\n');
    const message = `Olá! Gostaria de fazer este pedido:\n\n${lines}\n\n*Total: R$ ${total.toFixed(2).replace('.', ',')}*`;

    try {
      await addDoc(collection(db, 'orders'), {
        date: new Date().toISOString(),
        items: cart.map((i) => ({ name: i.name, qty: i.qty, price: i.price })),
        total,
      });
    } catch {
      // mesmo se falhar ao registrar, o pedido ainda segue pro WhatsApp
    }

    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank');
    setCart([]);
    setCartOpen(false);
    setSending(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: COLORS.cream, fontFamily: "'Poppins', sans-serif", paddingBottom: 40 }}>
      <FontImport />
      <div style={{ background: COLORS.green, padding: '32px 20px 24px', textAlign: 'center', position: 'relative' }}>
        <h1 style={{ fontFamily: "'Dancing Script', cursive", color: '#fff', fontSize: 42, margin: '0 0 4px' }}>Bella Cadô</h1>
        <p style={{ color: COLORS.sage, fontSize: 12, letterSpacing: 1, margin: 0 }}>PRESENTES QUE ACOLHEM, DETALHES QUE ENCANTAM</p>
        <button onClick={() => setCartOpen(true)} style={{ position: 'absolute', top: 24, right: 20, background: COLORS.pink, border: 'none', borderRadius: '50%', width: 40, height: 40, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ShoppingBag size={18} color={COLORS.green} />
          {cartCount > 0 && <span style={{ position: 'absolute', top: -4, right: -4, background: '#c1594a', color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{cartCount}</span>}
        </button>
      </div>

      {categories.length > 1 && (
        <div style={{ display: 'flex', gap: 8, padding: '16px 20px 4px', overflowX: 'auto' }}>
          {categories.map((cat) => (
            <button key={cat} onClick={() => setActiveCategory(cat)} style={{ padding: '7px 16px', borderRadius: 20, border: 'none', whiteSpace: 'nowrap', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: activeCategory === cat ? COLORS.green : '#fff', color: activeCategory === cat ? '#fff' : COLORS.green, flexShrink: 0 }}>{cat}</button>
          ))}
        </div>
      )}

      <div style={{ padding: 20 }}>
        {loading ? (
          <p style={{ textAlign: 'center', color: '#8a8378', fontSize: 13, marginTop: 40 }}>Carregando produtos...</p>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#8a8378' }}>
            <Heart size={32} color={COLORS.sand} style={{ marginBottom: 10 }} />
            <p style={{ fontSize: 14, margin: 0 }}>Nenhum produto disponível no momento.</p>
            <p style={{ fontSize: 13, margin: '4px 0 0' }}>Volte em breve — estamos preparando novidades!</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 14 }}>
            {filtered.map((p) => (
              <div key={p.id} style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 12px rgba(47,61,46,0.07)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ aspectRatio: '1', background: COLORS.sand, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {p.image ? <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Package size={28} color={COLORS.green} />}
                </div>
                <div style={{ padding: 12, flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <p style={{ margin: '0 0 4px', fontWeight: 600, fontSize: 13.5, color: COLORS.green, lineHeight: 1.3 }}>{p.name}</p>
                  {p.description && <p style={{ margin: '0 0 8px', fontSize: 11.5, color: '#8a8378', lineHeight: 1.4, flex: 1 }}>{p.description}</p>}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                    <span style={{ fontWeight: 700, color: COLORS.green, fontSize: 14 }}>R$ {Number(p.price).toFixed(2).replace('.', ',')}</span>
                    <button onClick={() => addToCart(p)} style={{ background: COLORS.pink, border: 'none', borderRadius: '50%', width: 30, height: 30, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={15} color={COLORS.green} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {cartOpen && <CartDrawer cart={cart} onClose={() => setCartOpen(false)} onUpdateQty={updateQty} onRemove={removeItem} onCheckout={checkout} sending={sending} />}
    </div>
  );
}
