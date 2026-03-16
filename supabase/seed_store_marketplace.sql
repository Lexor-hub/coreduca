delete from public.store_items;

insert into public.store_items (titulo, descricao, tipo, preco, imagem_url, destaque, ativo, ordem)
values 
  ('Lightstick Oficial Army Bomb Ver. 4', 'O lightstick oficial para iluminar os shows do BTS! Essencial para toda Army.', 'colecionador', 350.00, 'https://images.unsplash.com/photo-1540039120652-77c8629738d8?q=80&w=800&auto=format&fit=crop', true, true, 1),
  
  ('Moletom Coreduca Minimalista', 'Conforto e estilo streetwear com a nossa marca oficial. Detalhes bordados em Hangul.', 'vestuario', 189.90, 'https://images.unsplash.com/photo-1550614000-4b95d4ed7962?q=80&w=800&auto=format&fit=crop', false, true, 2),
  
  ('Kit Rotina Skincare 10 Passos (K-Beauty)', 'A famosa rotina de beleza coreana completa em um box especial com os melhores produtos importados de Seul.', 'skincare', 299.90, 'https://images.unsplash.com/photo-1610484826967-09c5720778c7?q=80&w=800&auto=format&fit=crop', true, true, 3),
  
  ('Box de Snacks Coreanos Misteriosos', 'Uma seleção surpresa irresistível de snacks coreanos doces e salgados. Inclui Pepero, Tteokbokki instantâneo, e Soju saborizado sem álcool!', 'alimento', 120.00, 'https://images.unsplash.com/photo-1580651315530-69c8e0026377?q=80&w=800&auto=format&fit=crop', false, true, 4),
  
  ('Álbum Twice "Feel Special" (Deluxe)', 'Álbum físico importado oficial. Inclui CD, photobook de 88 páginas, photocard aleatório e pôster exclusivo de pré-venda.', 'album', 180.00, 'https://images.unsplash.com/photo-1544648710-85f0967db509?q=80&w=800&auto=format&fit=crop', true, true, 5);
