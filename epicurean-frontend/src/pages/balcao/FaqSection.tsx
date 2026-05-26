import { useState } from 'react';

export interface QA {
  q: string;
  // Uma entrada = parágrafo explicativo; várias = passos numerados.
  a: string[];
}

const FAQ: QA[] = [
  {
    q: 'Quais são as duas formas de colocar um item no estoque?',
    a: [
      'São duas, e você escolhe pela situação. A primeira é o "Novo item", na aba "Estoque": um cadastro direto, para quando você só quer adicionar o item ao catálogo — montar o estoque inicial, registrar uma doação, fazer um ajuste de inventário ou já deixar um ingrediente pronto para a ficha técnica. Não exige compra nem fornecedor. A segunda é o "Lançar compra": use quando está dando entrada de uma mercadoria que realmente comprou. A compra cria o item sozinha (se ele ainda não existir) ou soma a quantidade ao item já cadastrado. Os dois botões ficam no topo da aba "Estoque".',
    ],
  },
  {
    q: 'Como cadastro um item direto no estoque (sem compra)?',
    a: [
      'Abra a aba "Estoque" e clique em "Novo item".',
      'Em "Identificação", preencha o nome do item, o tipo (Ingrediente, Insumo ou Produto) e a unidade de medida (kg, g, l, ml, un, cx ou pct). Esses três são obrigatórios.',
      'Em "Estoque inicial", informe quanto você já tem — deixe 0 se ainda não tem nada, dá para lançar entrada depois. Se quiser, informe também o custo unitário, usado para calcular o valor do estoque e a margem.',
      'Se o tipo for "Produto", aparece o campo "Preço de venda", já com a margem e o lucro calculados na hora.',
      'Se precisar, abra "Fornecedor padrão" para vincular um fornecedor (ou cadastrar um novo ali mesmo, só com o nome) e "Observações" para anotações livres. As duas seções são opcionais.',
      'Clique em "Salvar item".',
    ],
  },
  {
    q: 'Como registro uma compra?',
    a: [
      'Abra a aba "Compras" — ou clique em "Lançar compra" no topo da aba "Estoque" — e clique em "Registrar compra".',
      'Escolha o "Fornecedor" e a "Data" da compra. É preciso ter ao menos um fornecedor cadastrado.',
      'Clique em "+ Item" para cada produto comprado e preencha a linha: nome, quantidade, preço unitário e unidade de medida.',
      'Confira o "Total", somado automaticamente, e clique em "Registrar".',
      'O sistema cuida do estoque sozinho: se o item já existir, soma a quantidade comprada e recalcula o custo médio; se for novo, ele é criado no estoque automaticamente.',
    ],
  },
  {
    q: 'Qual a diferença entre Ingrediente, Insumo e Produto?',
    a: [
      'São os três tipos de item do estoque. "Ingrediente" é o que entra nas receitas (farinha, carne, legumes) — aparece para ser escolhido na ficha técnica dos pratos. "Insumo" é o que você usa mas não vai no prato: descartáveis, embalagens, produtos de limpeza — por isso ele não aparece na montagem da ficha técnica. "Produto" é um item finalizado, vendido direto ao cliente (por exemplo, uma bebida em lata) — só nele aparece o campo "Preço de venda".',
    ],
  },
  {
    q: 'O que é o custo médio (CMP) e como ele é calculado?',
    a: [
      'CMP quer dizer "custo médio ponderado": quanto, em média, cada unidade do item está custando no seu estoque. O sistema atualiza esse valor sozinho a cada entrada. Quando chega uma compra nova, ele combina o que você já tinha (quantidade e custo atuais) com o que está entrando (quantidade e preço da compra), proporcionalmente. Assim, se você comprou mais caro numa vez e mais barato em outra, o custo reflete a média real ponderada pela quantidade — e não só o último preço. É esse custo que alimenta o valor total do estoque e o cálculo de margem.',
    ],
  },
  {
    q: 'Como funciona a margem de lucro?',
    a: [
      'A margem compara o "Preço de venda" com o custo do item. O custo (custo médio) vem das suas entradas; ao digitar o preço de venda, o sistema mostra na hora a margem em porcentagem e o lucro em reais por unidade (preço de venda menos custo). Assim você já enxerga, na hora de cadastrar, se o preço dá lucro. Nos pratos, o mesmo raciocínio aparece como CMV — o custo dos ingredientes sobre o preço de venda do prato.',
    ],
  },
  {
    q: 'O que significa a quantidade aparecer em vermelho?',
    a: [
      'É um alerta de estoque baixo. A quantidade fica vermelha quando chega na — ou abaixo da — "Quantidade mínima" que você definiu para aquele item. É o sistema avisando que é hora de repor. Para repor, lance uma entrada do item: registre uma compra dele em "Compras" e a quantidade volta a somar no estoque.',
    ],
  },
  {
    q: 'Como monto um prato / ficha técnica?',
    a: [
      'Abra a aba "Cardápio" e clique em "Adicionar Prato".',
      'Preencha os dados do prato: nome, valor de venda, rendimento, categoria, descrição e, se quiser, a foto.',
      'Em "Construir Ficha Técnica", monte a receita: para cada ingrediente, escolha um item do estoque, informe a quantidade e a unidade usadas, e clique em "+".',
      'Só itens do tipo "Ingrediente" ou "Produto" aparecem para escolher — "Insumo" não entra em ficha. O ingrediente precisa já existir no estoque; se não existir, cadastre-o antes (pelo "Novo item" ou por uma compra).',
      'Conforme você adiciona ingredientes, o sistema calcula o custo da receita (CMV), a margem e o lucro do prato. Ao terminar, salve.',
    ],
  },
  {
    q: 'Cadastrei um item com um nome que já existe. O que acontece?',
    a: [
      'O sistema não cria um item duplicado: ele entende como uma nova entrada e soma a quantidade ao item que já existe, atualizando o custo médio. Por isso, ao digitar no "Novo item" um nome já cadastrado, aparece um aviso de que a quantidade será somada ao item existente. Se a intenção era outra, é só mudar o nome.',
    ],
  },
  {
    q: 'Como cadastro um fornecedor?',
    a: [
      'Abra a aba "Fornecedores" e clique em "Novo fornecedor".',
      'Preencha o nome (obrigatório). O CNPJ, o telefone e o e-mail são opcionais — preencha o que tiver à mão.',
      'Clique em "Salvar".',
      'Atalho: você também pode cadastrar um fornecedor rapidamente, só com o nome, dentro do "Novo item", na seção "Fornecedor padrão".',
      'Na lista de fornecedores, você acompanha quantas compras já fez com cada um e o total gasto.',
    ],
  },
  {
    q: 'Por que o botão "Registrar compra" está desativado?',
    a: [
      'Porque ainda não há nenhum fornecedor cadastrado, e toda compra precisa estar ligada a um fornecedor. Vá em "Fornecedores", cadastre ao menos um, e o botão será liberado. (Se você só quer adicionar um item ao catálogo sem compra, use o "Novo item" — esse não exige fornecedor.)',
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
