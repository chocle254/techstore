
-- Seed categories
INSERT INTO categories (name, slug, icon, image_url, item_count) VALUES
('Laptops', 'laptops', 'Laptop', 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_31bc8567-99fa-4e5d-b06f-435bf1e4d033.jpg', 120),
('Smartphones', 'smartphones', 'Smartphone', 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_4324271b-882c-4b19-8caa-3389ce1a0790.jpg', 200),
('Tablets', 'tablets', 'Tablet', 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_dfe1a0e0-e4d0-4028-876b-58f051d94394.jpg', 80),
('Accessories', 'accessories', 'Headphones', 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_f09ca43b-7a48-419b-83f5-89cbd35eebd0.jpg', 150),
('Audio', 'audio', 'Volume2', 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_87b7f7dd-94f6-4cea-b9bd-2f35a8205ef8.jpg', 100),
('Smartwatches', 'smartwatches', 'Watch', 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_24ff4883-1563-47a3-926c-14836cbd913c.jpg', 80),
('Gaming', 'gaming', 'Gamepad2', 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_feceff70-3b46-4fb9-b609-a43ff92914e9.jpg', 90),
('Cameras', 'cameras', 'Camera', 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_0cdc573e-0e10-4511-bdd0-0ead1f821a16.jpg', 70),
('Monitors', 'monitors', 'Monitor', 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_9a52f68d-b5a4-4689-a44b-b7c972b70356.jpg', 60),
('Storage', 'storage', 'HardDrive', 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_7aff8527-8627-4f8f-a23a-38794041350e.jpg', 60);

-- Seed products
INSERT INTO products (name, slug, description, price, original_price, category_id, brand, stock, rating, review_count, image_url, images, is_new, is_featured, is_deal, specs)
VALUES
(
  'Apple MacBook Air M2',
  'apple-macbook-air-m2',
  'Experience the power of M2 chip in an incredibly thin and light design. The MacBook Air M2 delivers exceptional performance with up to 18 hours of battery life.',
  1099.00, 1299.00,
  (SELECT id FROM categories WHERE slug='laptops'),
  'Apple', 45, 4.8, 320,
  'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_e2d7945b-a4e8-4296-ac08-c747f9557f93.jpg',
  ARRAY['https://miaoda-site-img.s3cdn.medo.dev/images/KLing_e2d7945b-a4e8-4296-ac08-c747f9557f93.jpg','https://miaoda-site-img.s3cdn.medo.dev/images/KLing_9aaf3a0c-6c76-4434-8d1a-9ae68c132930.jpg'],
  false, true, true,
  '{"processor":"Apple M2","ram":"8GB","storage":"256GB SSD","display":"13.6-inch Liquid Retina","battery":"Up to 18 hours","os":"macOS Ventura"}'::jsonb
),
(
  'Samsung Galaxy S24 Ultra',
  'samsung-galaxy-s24-ultra',
  'The Galaxy S24 Ultra pushes the boundaries of mobile photography with 200MP camera and the most advanced AI features ever seen in a Samsung device.',
  1199.00, 1199.00,
  (SELECT id FROM categories WHERE slug='smartphones'),
  'Samsung', 78, 4.7, 450,
  'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_452ca5e9-c37d-4d9a-ab6a-481be103b0c7.jpg',
  ARRAY['https://miaoda-site-img.s3cdn.medo.dev/images/KLing_452ca5e9-c37d-4d9a-ab6a-481be103b0c7.jpg','https://miaoda-site-img.s3cdn.medo.dev/images/KLing_4324271b-882c-4b19-8caa-3389ce1a0790.jpg'],
  true, true, false,
  '{"processor":"Snapdragon 8 Gen 3","ram":"12GB","storage":"256GB","display":"6.8-inch QHD+ Dynamic AMOLED","camera":"200MP","battery":"5000mAh"}'::jsonb
),
(
  'Sony WH-1000XM5',
  'sony-wh-1000xm5',
  'Industry-leading noise canceling headphones with 30-hour battery life and crystal-clear hands-free calling.',
  349.00, 429.00,
  (SELECT id FROM categories WHERE slug='audio'),
  'Sony', 120, 4.9, 230,
  'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_6d425ecc-5a29-46d7-8d47-2e1cdd919fed.jpg',
  ARRAY['https://miaoda-site-img.s3cdn.medo.dev/images/KLing_6d425ecc-5a29-46d7-8d47-2e1cdd919fed.jpg','https://miaoda-site-img.s3cdn.medo.dev/images/KLing_87b7f7dd-94f6-4cea-b9bd-2f35a8205ef8.jpg'],
  false, true, true,
  '{"type":"Over-ear","connectivity":"Bluetooth 5.2","battery":"30 hours","noise_canceling":"Industry-leading ANC","weight":"250g","foldable":"Yes"}'::jsonb
),
(
  'Apple Watch Series 9',
  'apple-watch-series-9',
  'The most advanced Apple Watch ever with the new S9 chip, double tap gesture, and brighter display.',
  399.00, 499.00,
  (SELECT id FROM categories WHERE slug='smartwatches'),
  'Apple', 55, 4.8, 310,
  'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_1b2db89b-1bb2-401a-8c3b-662e3e854801.jpg',
  ARRAY['https://miaoda-site-img.s3cdn.medo.dev/images/KLing_1b2db89b-1bb2-401a-8c3b-662e3e854801.jpg','https://miaoda-site-img.s3cdn.medo.dev/images/KLing_24ff4883-1563-47a3-926c-14836cbd913c.jpg'],
  true, true, true,
  '{"chip":"Apple S9","display":"Always-On Retina","water_resistance":"50m","health":"ECG, blood oxygen, crash detection","battery":"18 hours","connectivity":"GPS + Cellular"}'::jsonb
),
(
  'PlayStation 5',
  'playstation-5',
  'Play has no limits. Experience lightning-fast loading, deeper immersion and an all-new generation of incredible PlayStation games.',
  449.00, 499.00,
  (SELECT id FROM categories WHERE slug='gaming'),
  'Sony', 22, 4.9, 180,
  'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_f631625b-efcd-40f9-856b-a359da8b3cac.jpg',
  ARRAY['https://miaoda-site-img.s3cdn.medo.dev/images/KLing_f631625b-efcd-40f9-856b-a359da8b3cac.jpg','https://miaoda-site-img.s3cdn.medo.dev/images/KLing_feceff70-3b46-4fb9-b609-a43ff92914e9.jpg'],
  false, true, true,
  '{"processor":"AMD Zen 2","gpu":"AMD RDNA 2","storage":"825GB SSD","resolution":"Up to 8K","ray_tracing":"Yes","optical_drive":"Ultra HD Blu-ray"}'::jsonb
),
(
  'iPhone 15 Pro Max',
  'iphone-15-pro-max',
  'Forged in titanium. The iPhone 15 Pro Max features a 48MP main camera with 5x optical zoom and the most powerful chip ever in a smartphone.',
  1099.00, 1249.00,
  (SELECT id FROM categories WHERE slug='smartphones'),
  'Apple', 33, 4.8, 410,
  'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_3a89caa8-3d98-4b35-9c41-97632817844f.jpg',
  ARRAY['https://miaoda-site-img.s3cdn.medo.dev/images/KLing_3a89caa8-3d98-4b35-9c41-97632817844f.jpg','https://miaoda-site-img.s3cdn.medo.dev/images/KLing_452ca5e9-c37d-4d9a-ab6a-481be103b0c7.jpg'],
  false, true, true,
  '{"chip":"Apple A17 Pro","display":"6.7-inch Super Retina XDR ProMotion","camera":"48MP + 12MP + 12MP","battery":"Up to 29 hours","material":"Titanium","os":"iOS 17"}'::jsonb
),
(
  'ASUS ROG Gaming Laptop',
  'asus-rog-gaming-laptop',
  'Dominate the competition with the ROG Strix G16 featuring RTX 4070 graphics and 165Hz display.',
  1599.00, 1899.00,
  (SELECT id FROM categories WHERE slug='laptops'),
  'ASUS', 18, 4.6, 145,
  'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_9aaf3a0c-6c76-4434-8d1a-9ae68c132930.jpg',
  ARRAY['https://miaoda-site-img.s3cdn.medo.dev/images/KLing_9aaf3a0c-6c76-4434-8d1a-9ae68c132930.jpg'],
  true, false, true,
  '{"processor":"Intel Core i9-13980HX","gpu":"NVIDIA RTX 4070","ram":"16GB DDR5","storage":"1TB NVMe","display":"16-inch 165Hz","os":"Windows 11"}'::jsonb
),
(
  'Sony A7 IV Mirrorless Camera',
  'sony-a7-iv-mirrorless',
  'Full-frame mirrorless camera with 33MP BSI CMOS sensor, 4K 60p video, and advanced autofocus.',
  2499.00, 2799.00,
  (SELECT id FROM categories WHERE slug='cameras'),
  'Sony', 14, 4.8, 89,
  'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_0cdc573e-0e10-4511-bdd0-0ead1f821a16.jpg',
  ARRAY['https://miaoda-site-img.s3cdn.medo.dev/images/KLing_0cdc573e-0e10-4511-bdd0-0ead1f821a16.jpg'],
  false, false, true,
  '{"sensor":"33MP BSI CMOS Full-frame","video":"4K 60p","autofocus":"759 phase-detect points","stabilization":"5-axis IBIS","battery":"580 shots","mount":"Sony E-mount"}'::jsonb
),
(
  'Samsung 4K OLED Monitor 32"',
  'samsung-4k-oled-monitor-32',
  'Experience stunning visuals with the Samsung 32" 4K OLED monitor, featuring 0.1ms response time and HDR2000.',
  799.00, 999.00,
  (SELECT id FROM categories WHERE slug='monitors'),
  'Samsung', 30, 4.7, 156,
  'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_9a52f68d-b5a4-4689-a44b-b7c972b70356.jpg',
  ARRAY['https://miaoda-site-img.s3cdn.medo.dev/images/KLing_9a52f68d-b5a4-4689-a44b-b7c972b70356.jpg'],
  true, false, true,
  '{"size":"32-inch","resolution":"4K UHD 3840x2160","panel":"OLED","refresh_rate":"144Hz","response_time":"0.1ms","hdr":"HDR2000"}'::jsonb
),
(
  'Samsung 990 Pro 2TB NVMe SSD',
  'samsung-990-pro-2tb-nvme',
  'Blazing fast PCIe 4.0 NVMe SSD with read speeds up to 7450MB/s for gaming and creative workflows.',
  179.00, 229.00,
  (SELECT id FROM categories WHERE slug='storage'),
  'Samsung', 200, 4.9, 421,
  'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_7aff8527-8627-4f8f-a23a-38794041350e.jpg',
  ARRAY['https://miaoda-site-img.s3cdn.medo.dev/images/KLing_7aff8527-8627-4f8f-a23a-38794041350e.jpg'],
  false, false, true,
  '{"capacity":"2TB","interface":"PCIe 4.0 NVMe","read_speed":"7450 MB/s","write_speed":"6900 MB/s","form_factor":"M.2 2280","warranty":"5 years"}'::jsonb
),
(
  'iPad Pro 13" M4',
  'ipad-pro-13-m4',
  'The thinnest Apple product ever. Ultra Retina XDR display with Apple Pencil Pro support.',
  1299.00, 1299.00,
  (SELECT id FROM categories WHERE slug='tablets'),
  'Apple', 40, 4.8, 201,
  'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_dfe1a0e0-e4d0-4028-876b-58f051d94394.jpg',
  ARRAY['https://miaoda-site-img.s3cdn.medo.dev/images/KLing_dfe1a0e0-e4d0-4028-876b-58f051d94394.jpg'],
  true, false, false,
  '{"chip":"Apple M4","display":"13-inch Ultra Retina XDR OLED","storage":"256GB","connectivity":"Wi-Fi 6E + 5G","pencil":"Apple Pencil Pro","os":"iPadOS 17"}'::jsonb
),
(
  'Bose QuietComfort 45',
  'bose-quietcomfort-45',
  'World-class noise cancellation with lifelike audio. Up to 24 hours of battery life.',
  279.00, 329.00,
  (SELECT id FROM categories WHERE slug='audio'),
  'Bose', 65, 4.7, 287,
  'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_f09ca43b-7a48-419b-83f5-89cbd35eebd0.jpg',
  ARRAY['https://miaoda-site-img.s3cdn.medo.dev/images/KLing_f09ca43b-7a48-419b-83f5-89cbd35eebd0.jpg'],
  false, false, true,
  '{"type":"Over-ear","connectivity":"Bluetooth 5.1","battery":"24 hours","noise_canceling":"Quiet Mode & Aware Mode","weight":"238g","foldable":"Yes"}'::jsonb
);

-- Seed reviews
INSERT INTO reviews (product_id, reviewer_name, rating, title, comment) VALUES
((SELECT id FROM products WHERE slug='apple-macbook-air-m2'), 'John D.', 5, 'Best laptop I have owned', 'Incredible performance and battery life. The M2 chip handles everything effortlessly.'),
((SELECT id FROM products WHERE slug='apple-macbook-air-m2'), 'Sarah M.', 4, 'Great machine, minor cons', 'Very fast and light. Only wish it had more ports. Great for everyday use.'),
((SELECT id FROM products WHERE slug='samsung-galaxy-s24-ultra'), 'Mike R.', 5, 'Camera is insane', 'The 200MP camera blows every other phone out of the water. AI features are genuinely useful.'),
((SELECT id FROM products WHERE slug='sony-wh-1000xm5'), 'Lisa K.', 5, 'Perfect noise cancellation', 'Best headphones I have ever used. The ANC is absolutely incredible on flights.'),
((SELECT id FROM products WHERE slug='apple-watch-series-9'), 'Tom W.', 5, 'Double tap is a game changer', 'The new gesture feature makes this watch so much easier to use one-handed.'),
((SELECT id FROM products WHERE slug='iphone-15-pro-max'), 'Emma S.', 5, 'Worth every penny', 'The titanium build feels premium and the camera system is unmatched.');

-- Seed blog posts
INSERT INTO blog_posts (title, slug, excerpt, content, image_url, author, category) VALUES
('Top 10 Laptops for 2026', 'top-10-laptops-2026', 'We have tested over 50 laptops to find the very best for every budget and use case this year.', 'Full article content about the top 10 laptops...', 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_e2d7945b-a4e8-4296-ac08-c747f9557f93.jpg', 'TechStore Team', 'Reviews'),
('5G Smartphones: What You Need to Know', '5g-smartphones-guide', 'Everything you need to know before buying a 5G smartphone in 2026, from coverage to battery impact.', 'Full article about 5G smartphones...', 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_452ca5e9-c37d-4d9a-ab6a-481be103b0c7.jpg', 'TechStore Team', 'Guide'),
('Best Noise-Canceling Headphones Ranked', 'best-noise-canceling-headphones', 'Our experts rank the top noise-canceling headphones on the market right now.', 'Full article about headphones...', 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_6d425ecc-5a29-46d7-8d47-2e1cdd919fed.jpg', 'TechStore Team', 'Reviews'),
('Gaming Setup Guide 2026', 'gaming-setup-guide-2026', 'Build the ultimate gaming setup with our comprehensive guide covering consoles, monitors, and accessories.', 'Full gaming setup guide...', 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_feceff70-3b46-4fb9-b609-a43ff92914e9.jpg', 'TechStore Team', 'Guide'),
('Camera Buying Guide for Beginners', 'camera-buying-guide-beginners', 'Not sure which camera to buy? Our beginner-friendly guide breaks down the key differences.', 'Full camera buying guide...', 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_0cdc573e-0e10-4511-bdd0-0ead1f821a16.jpg', 'TechStore Team', 'Guide'),
('The Future of Wearable Tech', 'future-wearable-tech', 'From health monitoring to AR, we explore what is next for wearable technology in 2026 and beyond.', 'Full article about wearables...', 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_1b2db89b-1bb2-401a-8c3b-662e3e854801.jpg', 'TechStore Team', 'Trends');

-- Seed store settings
INSERT INTO store_settings (store_name, contact_email, currency, low_stock_threshold) VALUES
('TechStore', 'support@techstore.com', 'USD', 10);
