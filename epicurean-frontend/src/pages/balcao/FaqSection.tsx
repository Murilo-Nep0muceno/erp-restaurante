import { useState } from 'react';

export interface QA {
  q: string;
  // Uma entrada = parágrafo explicativo; várias = passos numerados.
  a: string[];
}

const FAQ: QA[] = [
  {
    q: 'Como registro uma compra?',
    a: [
      'No menu lateral, abra a aba "Compras" e clique no botão "Registrar compra".',
      'No campo "Fornecedor", escolha de quem você comprou (é preciso ter ao menos um fornecedor cadastrado — veja a pergunta sobre cadastrar fornecedor).',
      'Em "Data", informe o dia da compra.',
      'Clique em "+ Item" para cada produto comprado e preencha a linha: o nome do item (ex.: Leite), a quantidade, o preço unitário e a unidade de medida (kg, g, l, ml ou un).',
      'Confira o "Total", que é somado automaticamente (preço × quantidade de cada item), e clique em "Registrar".',
      'Pronto: se o item já existir no estoque, a quantidade dele é somada automaticamente; se for um item novo, ele fica disponível para você cadastrar no estoque.',
    ],
  },
  {
    q: 'Como cadastro um item no estoque?',
    a: [
      'Antes de tudo, o item precisa ter sido comprado — o cadastro nasce da compra. Então primeiro vá na aba "Compras" e registre uma compra com a data, o fornecedor e a descrição do item ou dos itens (nome, quantidade, preço e unidade).',
      'Depois abra "Estoque / Insumos" e clique em "Novo Item".',
      'No campo "Item comprado", selecione o item que você acabou de comprar. Ao escolher, o sistema já puxa da compra, sem você digitar: o fornecedor, o custo médio (a média dos preços que você pagou) e a quantidade comprada (a soma).',
      'Agora você define o restante: o "Tipo" (Ingrediente ou Produto Final), a "Unidade de medida" e a "Quantidade mínima" — quando o estoque chegar nesse valor, o item fica destacado em vermelho avisando que é hora de repor.',
      'Por fim, informe o "Preço de venda". Ao digitar, o sistema mostra na hora a margem (%) e o lucro por unidade sobre o custo.',
      'Clique em "Salvar" e o item entra no estoque.',
    ],
  },
  {
    q: 'Por que o item que comprei não aparece para cadastrar no estoque?',
    a: [
      'O "Novo Item" só lista itens que já foram comprados e que ainda não viraram cadastro. Se a lista estiver vazia, é porque nenhuma compra foi registrada ainda — ou porque todos os itens comprados já foram cadastrados.',
      'Solução: vá em "Compras", registre a compra do item (com nome, quantidade, preço e unidade) e ele passará a aparecer na lista do "Novo Item".',
    ],
  },
  {
    q: 'O que significa a quantidade aparecer em vermelho?',
    a: [
      'É um alerta de estoque baixo. A quantidade do item ficou em vermelho porque chegou na — ou abaixo da — "Quantidade mínima" que você definiu no cadastro daquele item. Na prática, é o sistema avisando que está na hora de repor: para repor, basta registrar uma nova compra desse item na aba "Compras", e a quantidade será somada de volta ao estoque.',
    ],
  },
  {
    q: 'Como funciona a margem de lucro?',
    a: [
      'O custo do item (custo médio) vem automaticamente das suas compras. Quando você informa o "Preço de venda" no cadastro do item, o sistema calcula sozinho duas coisas: a margem em porcentagem e o lucro em reais por unidade — que é a diferença entre o preço de venda e o custo. Assim, ainda na hora de cadastrar, você já enxerga se o preço que está colocando dá lucro ou não.',
    ],
  },
  {
    q: 'Como monto um prato / ficha técnica?',
    a: [
      'Abra a aba "Cardápio (Fichas)" e clique em "Adicionar Prato".',
      'Preencha as informações do prato: nome, valor de venda, rendimento, categoria, descrição e, se quiser, a foto.',
      'Na parte "Construir Ficha Técnica", monte a receita: para cada ingrediente, escolha um item que já está no estoque, informe a quantidade usada e a unidade, e clique em "+".',
      'Importante: o ingrediente precisa já existir no estoque. Se ele não estiver lá, cadastre-o antes — registrando a compra dele e depois criando o item no estoque.',
      'Conforme você adiciona ingredientes, o sistema calcula o custo da receita (CMV), a margem e o lucro do prato. Quando terminar, salve.',
    ],
  },
  {
    q: 'Como cadastro um fornecedor?',
    a: [
      'Abra a aba "Fornecedores" e clique em "Novo fornecedor".',
      'Preencha a "Razão social / Nome" e o "CNPJ" (campos obrigatórios), e também o "Telefone" e o "E-mail" — esses dois são opcionais, mas recomendados para você ter o contato à mão.',
      'Clique em "Salvar".',
      'Depois, na lista de fornecedores, você acompanha quantas compras já fez com cada um e o total gasto.',
    ],
  },
  {
    q: 'Por que o botão "Registrar compra" está desativado?',
    a: [
      'Porque não há nenhum fornecedor cadastrado ainda — toda compra precisa estar ligada a um fornecedor. Vá em "Fornecedores", cadastre ao menos um, e o botão "Registrar compra" será liberado.',
    ],
  },
];

interface FaqSectionProps {
  title?: string;
  subtitle?: string;
  items?: QA[];
}

export default function FaqSection({
  title = 'Perguntas Frequentes',
  subtitle = 'Passo a passo das tarefas mais comuns do painel de balcão.',
  items = FAQ,
}: FaqSectionProps) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">{title}</h2>
      </div>
      <p style={{ fontSize: 'var(--fs-md)', color: 'var(--gray-400)', marginBottom: 16 }}>
        {subtitle}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map((item, idx) => {
          const isOpen = open === idx;
          return (
            <div
              key={idx}
              style={{
                border: '1px solid var(--gray-200)',
                borderRadius: 8,
                overflow: 'hidden',
              }}
            >
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : idx)}
                aria-expanded={isOpen}
                style={{
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 12,
                  padding: '14px 16px',
                  background: isOpen ? 'var(--gold-pale)' : 'var(--white)',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: 'var(--fs-lg)',
                  fontWeight: 600,
                  color: 'var(--dark)',
                }}
              >
                <span>{item.q}</span>
                <span aria-hidden style={{ color: 'var(--gold)', flexShrink: 0, fontSize: 'var(--fs-2xl)' }}>
                  {isOpen ? '−' : '+'}
                </span>
              </button>
              {isOpen && (
                <div
                  style={{
                    padding: '4px 16px 16px',
                    fontSize: 'var(--fs-lg)',
                    lineHeight: 1.6,
                    color: 'var(--gray-600)',
                  }}
                >
                  {item.a.length === 1 ? (
                    <p>{item.a[0]}</p>
                  ) : (
                    <ol style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {item.a.map((step, i) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ol>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
