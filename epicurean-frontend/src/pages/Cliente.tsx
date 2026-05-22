import { useMemo, useState } from 'react';
import { useFetch } from '../hooks/useFetch';
import { getPublicMenu } from '../services/dish.service';
import { getPublicSettings } from '../services/settings.service';
import { MOCK_MENU } from '../lib/mockMenu';
import { formatBRL } from '../lib/format';
import AsyncState from '../components/AsyncState';
import { IconUsers } from '../components/icons';

// Cardápio digital público, mobile-first. Única tela (além do login) acessível
// sem autenticação. Os dados vêm de endpoints públicos do backend.
export default function Cliente() {
  const { data: menu, loading, error } = useFetch(getPublicMenu);
  const { data: settings } = useFetch(getPublicSettings);
  const [cat, setCat] = useState('Todas');

  const usingFallback = !!error;
  const dishes = (usingFallback ? MOCK_MENU : (menu ?? [])).filter((d) => d.available_dish);
  const restaurantName = settings?.restaurantName ?? 'Restaurante';

  const categories = useMemo(() => {
    const set = new Set<string>();
    dishes.forEach((d) => {
      if (d.category) set.add(d.category);
    });
    return ['Todas', ...set];
  }, [dishes]);

  const filtered = cat === 'Todas' ? dishes : dishes.filter((d) => d.category === cat);

  return (
    <div className="client-page">
      <div className="client-wrapper">
        <header className="client-header">
          <p className="client-kicker">{restaurantName}</p>
          <h1 className="client-title">Cardápio Digital</h1>
        </header>

        <div className="client-body">
          {categories.length > 1 && (
            <div className="cat-tabs client-cats">
              {categories.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`cat-tab${cat === c ? ' active' : ''}`}
                  onClick={() => setCat(c)}
                >
                  {c}
                </button>
              ))}
            </div>
          )}

          {loading && <AsyncState loading error={null} />}

          {!loading && (
            <>
              {usingFallback && (
                <p className="client-fallback">Exibindo cardápio de demonstração.</p>
              )}

              {filtered.length === 0 ? (
                <p className="client-empty">Nenhum prato disponível nesta categoria.</p>
              ) : (
                <div className="client-dishes">
                  {filtered.map((d) => (
                    <article className="client-dish" key={d.id_recipe_dish}>
                      <div className="client-dish-img">
                        {d.image ? (
                          <img src={d.image} alt={d.name_dish} />
                        ) : (
                          <div className="client-dish-img-ph">
                            <span style={{ color: 'var(--gold)', fontSize: 'var(--fs-5xl)' }}>🍽</span>
                          </div>
                        )}
                      </div>
                      <div className="client-dish-body">
                        <div className="client-dish-row">
                          <span className="client-dish-name">{d.name_dish}</span>
                          <span className="client-dish-price">{formatBRL(d.selling_price_dish)}</span>
                        </div>
                        {d.description_dish && (
                          <p className="client-dish-desc">{d.description_dish}</p>
                        )}
                        <div className="client-dish-foot">
                          <IconUsers width={14} height={14} />
                          <span>Serve {d.serves ?? 1} pessoa(s)</span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
