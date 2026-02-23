DO $$
DECLARE
    vb UUID := '72be0caf-502a-4cf8-ab6e-1d89df190b8c';
    eb UUID := '7f5a27c4-e201-4ca4-a185-68d97f34539a';
    coloc UUID := 'fa658770-3c2e-4320-ae3b-2f65992043b3';

    cat_loyer UUID := '0448afc3-aebb-4aae-bdf5-130f6d96dbbb';
    cat_courses UUID := 'ba80985a-ea65-406f-9fe8-3c9a13c17184';
    cat_elec UUID := '460c827f-5ba3-496f-8071-eb8a55e4ddca';
    cat_internet UUID := '1b86c745-075d-4f2d-b691-e43a53461151';
    cat_eau UUID := '71866890-20d3-4ad7-9fef-cc42177aed01';
    cat_gaz UUID := '67303024-e601-4569-9d24-6b1d5c79dc11';
    cat_entretien UUID := '6cb87bc9-1096-44fd-a761-389e654be381';
    cat_restaurant UUID := '7d52ea86-7f99-4c97-a280-261f8f84ab61';
    cat_loisirs UUID := '07877de6-6f42-4ebc-8727-1854d91fefe8';
    cat_transport UUID := 'a862070a-f1b9-47e1-97f5-70a7bdf94b53';
    cat_menage UUID := '38846e85-4c1b-4d86-8e62-c33625f71837';
    cat_autre UUID := '9434e902-40f0-4da6-8e6f-8534b3a317cb';
    cat_assurance UUID := '5067476a-ca1b-41a7-ac6d-4ff868a5e3c0';
    cat_electro UUID := '2f3f3a7b-67aa-488a-8797-f0ba15aaf0d0';
    cat_mobilier UUID := '0ae80e9e-9157-4f55-8eae-c4ee290ac8c7';

    m INT;
    cur DATE;
    eid UUID;
    payer UUID;
    amt DECIMAL;
    d INT;
    mn INT;
    titles TEXT[];
    title TEXT;
BEGIN
    -- Boucle sur 24 mois : mars 2024 -> fevrier 2026
    FOR m IN 0..23 LOOP
        cur := DATE '2024-03-01' + (m || ' months')::INTERVAL;
        mn := EXTRACT(MONTH FROM cur)::INT;

        -- Alterner le payeur du loyer
        payer := CASE WHEN m % 2 = 0 THEN vb ELSE eb END;

        ---------------------------------------------------------------
        -- LOYER : 700 EUR le 1er du mois
        ---------------------------------------------------------------
        eid := gen_random_uuid();
        INSERT INTO expenses (id, colocation_id, paid_by, category_id, title, amount, split_type, expense_date, created_at)
        VALUES (eid, coloc, payer, cat_loyer,
                'Loyer ' || TO_CHAR(cur, 'TMMonth YYYY'),
                700.00, 'equal', cur, cur::TIMESTAMP);
        INSERT INTO expense_splits (id, expense_id, user_id, amount, percentage, is_settled)
        VALUES (gen_random_uuid(), eid, vb, 350.00, 50, false),
               (gen_random_uuid(), eid, eb, 350.00, 50, false);

        ---------------------------------------------------------------
        -- INTERNET : 29.99 EUR le ~5
        ---------------------------------------------------------------
        eid := gen_random_uuid();
        INSERT INTO expenses (id, colocation_id, paid_by, category_id, title, amount, split_type, expense_date, created_at)
        VALUES (eid, coloc, CASE WHEN m % 3 = 0 THEN vb ELSE eb END, cat_internet,
                'Abonnement Internet', 29.99, 'equal', cur + 4, (cur + 4)::TIMESTAMP);
        INSERT INTO expense_splits (id, expense_id, user_id, amount, percentage, is_settled)
        VALUES (gen_random_uuid(), eid, vb, 15.00, 50, false),
               (gen_random_uuid(), eid, eb, 14.99, 50, false);

        ---------------------------------------------------------------
        -- ELECTRICITE : variable selon saison, le ~10
        ---------------------------------------------------------------
        amt := CASE
            WHEN mn IN (12,1,2)  THEN 62 + (random()*22)::INT
            WHEN mn IN (6,7,8)   THEN 34 + (random()*14)::INT
            ELSE                      44 + (random()*16)::INT
        END;
        eid := gen_random_uuid();
        INSERT INTO expenses (id, colocation_id, paid_by, category_id, title, amount, split_type, expense_date, created_at)
        VALUES (eid, coloc, CASE WHEN m % 2 = 1 THEN vb ELSE eb END, cat_elec,
                'Facture electricite', ROUND(amt, 2), 'equal', cur + 9, (cur + 9)::TIMESTAMP);
        INSERT INTO expense_splits (id, expense_id, user_id, amount, percentage, is_settled)
        VALUES (gen_random_uuid(), eid, vb, ROUND(amt/2, 2), 50, false),
               (gen_random_uuid(), eid, eb, ROUND(amt/2, 2), 50, false);

        ---------------------------------------------------------------
        -- GAZ : oct-mars seulement
        ---------------------------------------------------------------
        IF mn IN (10,11,12,1,2,3) THEN
            amt := CASE WHEN mn IN (12,1,2) THEN 48 + (random()*22)::INT ELSE 28 + (random()*18)::INT END;
            eid := gen_random_uuid();
            INSERT INTO expenses (id, colocation_id, paid_by, category_id, title, amount, split_type, expense_date, created_at)
            VALUES (eid, coloc, CASE WHEN m % 2 = 0 THEN eb ELSE vb END, cat_gaz,
                    'Facture gaz', ROUND(amt, 2), 'equal', cur + 11, (cur + 11)::TIMESTAMP);
            INSERT INTO expense_splits (id, expense_id, user_id, amount, percentage, is_settled)
            VALUES (gen_random_uuid(), eid, vb, ROUND(amt/2, 2), 50, false),
                   (gen_random_uuid(), eid, eb, ROUND(amt/2, 2), 50, false);
        END IF;

        ---------------------------------------------------------------
        -- EAU : tous les 2 mois, le ~15
        ---------------------------------------------------------------
        IF m % 2 = 0 THEN
            amt := 32 + (random()*14)::INT;
            eid := gen_random_uuid();
            INSERT INTO expenses (id, colocation_id, paid_by, category_id, title, amount, split_type, expense_date, created_at)
            VALUES (eid, coloc, CASE WHEN m % 4 = 0 THEN vb ELSE eb END, cat_eau,
                    'Facture eau', ROUND(amt, 2), 'equal', cur + 14, (cur + 14)::TIMESTAMP);
            INSERT INTO expense_splits (id, expense_id, user_id, amount, percentage, is_settled)
            VALUES (gen_random_uuid(), eid, vb, ROUND(amt/2, 2), 50, false),
                   (gen_random_uuid(), eid, eb, ROUND(amt/2, 2), 50, false);
        END IF;

        ---------------------------------------------------------------
        -- COURSES : 3-4 par mois
        ---------------------------------------------------------------
        -- Grosses courses debut de mois
        amt := 45 + (random()*35)::INT;
        d := 2 + (random()*3)::INT;
        titles := ARRAY['Courses Carrefour','Courses Lidl','Courses Auchan','Courses Leclerc'];
        title := titles[1 + (random()*3)::INT];
        eid := gen_random_uuid();
        INSERT INTO expenses (id, colocation_id, paid_by, category_id, title, amount, split_type, expense_date, created_at)
        VALUES (eid, coloc, vb, cat_courses, title, ROUND(amt, 2), 'equal', cur + d, (cur + d)::TIMESTAMP);
        INSERT INTO expense_splits (id, expense_id, user_id, amount, percentage, is_settled)
        VALUES (gen_random_uuid(), eid, vb, ROUND(amt/2, 2), 50, false),
               (gen_random_uuid(), eid, eb, ROUND(amt/2, 2), 50, false);

        -- Courses milieu de mois
        amt := 30 + (random()*40)::INT;
        d := 11 + (random()*4)::INT;
        titles := ARRAY['Courses Intermarche','Courses Monoprix','Courses Picard','Courses Aldi'];
        title := titles[1 + (random()*3)::INT];
        eid := gen_random_uuid();
        INSERT INTO expenses (id, colocation_id, paid_by, category_id, title, amount, split_type, expense_date, created_at)
        VALUES (eid, coloc, eb, cat_courses, title, ROUND(amt, 2), 'equal', cur + d, (cur + d)::TIMESTAMP);
        INSERT INTO expense_splits (id, expense_id, user_id, amount, percentage, is_settled)
        VALUES (gen_random_uuid(), eid, vb, ROUND(amt/2, 2), 50, false),
               (gen_random_uuid(), eid, eb, ROUND(amt/2, 2), 50, false);

        -- Courses fin de mois
        amt := 25 + (random()*35)::INT;
        d := 19 + (random()*5)::INT;
        titles := ARRAY['Courses de la semaine','Marche du dimanche','Courses Franprix','Primeur + boulangerie'];
        title := titles[1 + (random()*3)::INT];
        eid := gen_random_uuid();
        INSERT INTO expenses (id, colocation_id, paid_by, category_id, title, amount, split_type, expense_date, created_at)
        VALUES (eid, coloc, CASE WHEN random()>0.5 THEN vb ELSE eb END, cat_courses, title, ROUND(amt, 2), 'equal', cur + d, (cur + d)::TIMESTAMP);
        INSERT INTO expense_splits (id, expense_id, user_id, amount, percentage, is_settled)
        VALUES (gen_random_uuid(), eid, vb, ROUND(amt/2, 2), 50, false),
               (gen_random_uuid(), eid, eb, ROUND(amt/2, 2), 50, false);

        -- 4eme course (60% du temps)
        IF random() > 0.4 THEN
            amt := 12 + (random()*25)::INT;
            d := 24 + (random()*3)::INT;
            titles := ARRAY['Depannage epicerie','Petit Carrefour','Courses du soir','Boulangerie + fromage'];
            title := titles[1 + (random()*3)::INT];
            eid := gen_random_uuid();
            INSERT INTO expenses (id, colocation_id, paid_by, category_id, title, amount, split_type, expense_date, created_at)
            VALUES (eid, coloc, CASE WHEN random()>0.5 THEN vb ELSE eb END, cat_courses, title, ROUND(amt, 2), 'equal', cur + d, (cur + d)::TIMESTAMP);
            INSERT INTO expense_splits (id, expense_id, user_id, amount, percentage, is_settled)
            VALUES (gen_random_uuid(), eid, vb, ROUND(amt/2, 2), 50, false),
                   (gen_random_uuid(), eid, eb, ROUND(amt/2, 2), 50, false);
        END IF;

        ---------------------------------------------------------------
        -- RESTAURANT / LIVRAISON : 1-2 par mois
        ---------------------------------------------------------------
        amt := 18 + (random()*28)::INT;
        d := 7 + (random()*8)::INT;
        titles := ARRAY['Pizza du vendredi','Kebab','Sushi','Burger King','McDo','Thai Express'];
        title := titles[1 + (random()*5)::INT];
        eid := gen_random_uuid();
        INSERT INTO expenses (id, colocation_id, paid_by, category_id, title, amount, split_type, expense_date, created_at)
        VALUES (eid, coloc, CASE WHEN random()>0.5 THEN vb ELSE eb END, cat_restaurant, title, ROUND(amt, 2), 'equal', cur + d, (cur + d)::TIMESTAMP);
        INSERT INTO expense_splits (id, expense_id, user_id, amount, percentage, is_settled)
        VALUES (gen_random_uuid(), eid, vb, ROUND(amt/2, 2), 50, false),
               (gen_random_uuid(), eid, eb, ROUND(amt/2, 2), 50, false);

        -- 2e sortie (65% du temps)
        IF random() > 0.35 THEN
            amt := 14 + (random()*22)::INT;
            d := 20 + (random()*6)::INT;
            titles := ARRAY['Dominos','Uber Eats','Deliveroo','Just Eat','Restaurant chinois','Tacos'];
            title := titles[1 + (random()*5)::INT];
            eid := gen_random_uuid();
            INSERT INTO expenses (id, colocation_id, paid_by, category_id, title, amount, split_type, expense_date, created_at)
            VALUES (eid, coloc, CASE WHEN random()>0.5 THEN vb ELSE eb END, cat_restaurant, title, ROUND(amt, 2), 'equal', cur + d, (cur + d)::TIMESTAMP);
            INSERT INTO expense_splits (id, expense_id, user_id, amount, percentage, is_settled)
            VALUES (gen_random_uuid(), eid, vb, ROUND(amt/2, 2), 50, false),
                   (gen_random_uuid(), eid, eb, ROUND(amt/2, 2), 50, false);
        END IF;

        ---------------------------------------------------------------
        -- MENAGE : tous les 2-3 mois
        ---------------------------------------------------------------
        IF m % 3 = 0 THEN
            amt := 8 + (random()*16)::INT;
            titles := ARRAY['Produits menagers','Liquide vaisselle + eponges','Produits entretien','Papier toilette + sopalin'];
            title := titles[1 + (random()*3)::INT];
            eid := gen_random_uuid();
            INSERT INTO expenses (id, colocation_id, paid_by, category_id, title, amount, split_type, expense_date, created_at)
            VALUES (eid, coloc, CASE WHEN random()>0.5 THEN vb ELSE eb END, cat_menage, title, ROUND(amt, 2), 'equal', cur + 16, (cur + 16)::TIMESTAMP);
            INSERT INTO expense_splits (id, expense_id, user_id, amount, percentage, is_settled)
            VALUES (gen_random_uuid(), eid, vb, ROUND(amt/2, 2), 50, false),
                   (gen_random_uuid(), eid, eb, ROUND(amt/2, 2), 50, false);
        END IF;

        ---------------------------------------------------------------
        -- LOISIRS : ~1 sur 2 mois
        ---------------------------------------------------------------
        IF random() > 0.45 THEN
            amt := 8 + (random()*32)::INT;
            d := 6 + (random()*18)::INT;
            titles := ARRAY['Cinema','Netflix','Spotify Duo','Bowling','Jeu video','Soiree jeux','Escape game'];
            title := titles[1 + (random()*6)::INT];
            eid := gen_random_uuid();
            INSERT INTO expenses (id, colocation_id, paid_by, category_id, title, amount, split_type, expense_date, created_at)
            VALUES (eid, coloc, CASE WHEN random()>0.5 THEN vb ELSE eb END, cat_loisirs, title, ROUND(amt, 2), 'equal', cur + d, (cur + d)::TIMESTAMP);
            INSERT INTO expense_splits (id, expense_id, user_id, amount, percentage, is_settled)
            VALUES (gen_random_uuid(), eid, vb, ROUND(amt/2, 2), 50, false),
                   (gen_random_uuid(), eid, eb, ROUND(amt/2, 2), 50, false);
        END IF;

        ---------------------------------------------------------------
        -- TRANSPORT : occasional (~30%)
        ---------------------------------------------------------------
        IF random() > 0.7 THEN
            amt := 15 + (random()*45)::INT;
            d := 4 + (random()*20)::INT;
            titles := ARRAY['Essence','Billet de train','Peage autoroute','Covoiturage BlaBlaCar'];
            title := titles[1 + (random()*3)::INT];
            eid := gen_random_uuid();
            INSERT INTO expenses (id, colocation_id, paid_by, category_id, title, amount, split_type, expense_date, created_at)
            VALUES (eid, coloc, CASE WHEN random()>0.5 THEN vb ELSE eb END, cat_transport, title, ROUND(amt, 2), 'equal', cur + d, (cur + d)::TIMESTAMP);
            INSERT INTO expense_splits (id, expense_id, user_id, amount, percentage, is_settled)
            VALUES (gen_random_uuid(), eid, vb, ROUND(amt/2, 2), 50, false),
                   (gen_random_uuid(), eid, eb, ROUND(amt/2, 2), 50, false);
        END IF;

        ---------------------------------------------------------------
        -- ASSURANCE HABITATION : tous les 6 mois
        ---------------------------------------------------------------
        IF m % 6 = 0 THEN
            eid := gen_random_uuid();
            INSERT INTO expenses (id, colocation_id, paid_by, category_id, title, amount, split_type, expense_date, created_at)
            VALUES (eid, coloc, vb, cat_assurance, 'Assurance habitation (semestriel)', 126.00, 'equal', cur + 2, (cur + 2)::TIMESTAMP);
            INSERT INTO expense_splits (id, expense_id, user_id, amount, percentage, is_settled)
            VALUES (gen_random_uuid(), eid, vb, 63.00, 50, false),
                   (gen_random_uuid(), eid, eb, 63.00, 50, false);
        END IF;

        ---------------------------------------------------------------
        -- ENTRETIEN : tous les 4 mois environ
        ---------------------------------------------------------------
        IF m % 4 = 2 THEN
            amt := 18 + (random()*55)::INT;
            titles := ARRAY['Reparation robinet','Ampoules + piles','Detartrage machine a laver','Joint de douche','Reparation store'];
            title := titles[1 + (random()*4)::INT];
            eid := gen_random_uuid();
            INSERT INTO expenses (id, colocation_id, paid_by, category_id, title, amount, split_type, expense_date, created_at)
            VALUES (eid, coloc, CASE WHEN random()>0.5 THEN vb ELSE eb END, cat_entretien, title, ROUND(amt, 2), 'equal', cur + 20, (cur + 20)::TIMESTAMP);
            INSERT INTO expense_splits (id, expense_id, user_id, amount, percentage, is_settled)
            VALUES (gen_random_uuid(), eid, vb, ROUND(amt/2, 2), 50, false),
                   (gen_random_uuid(), eid, eb, ROUND(amt/2, 2), 50, false);
        END IF;

    END LOOP;

    ---------------------------------------------------------------
    -- ACHATS PONCTUELS : electromenager, mobilier, divers
    ---------------------------------------------------------------

    -- Micro-ondes (avril 2024)
    eid := gen_random_uuid();
    INSERT INTO expenses VALUES (eid, coloc, vb, cat_electro, 'Micro-ondes Samsung', NULL, 89.99, 'equal', '2024-04-15', '2024-04-15'::TIMESTAMP);
    INSERT INTO expense_splits VALUES (gen_random_uuid(), eid, vb, 45.00, 50, false), (gen_random_uuid(), eid, eb, 44.99, 50, false);

    -- Aspirateur (sept 2024)
    eid := gen_random_uuid();
    INSERT INTO expenses VALUES (eid, coloc, eb, cat_electro, 'Aspirateur Rowenta', NULL, 149.99, 'equal', '2024-09-08', '2024-09-08'::TIMESTAMP);
    INSERT INTO expense_splits VALUES (gen_random_uuid(), eid, vb, 75.00, 50, false), (gen_random_uuid(), eid, eb, 74.99, 50, false);

    -- Bouilloire (jan 2025)
    eid := gen_random_uuid();
    INSERT INTO expenses VALUES (eid, coloc, vb, cat_electro, 'Bouilloire electrique', NULL, 34.99, 'equal', '2025-01-12', '2025-01-12'::TIMESTAMP);
    INSERT INTO expense_splits VALUES (gen_random_uuid(), eid, vb, 17.50, 50, false), (gen_random_uuid(), eid, eb, 17.49, 50, false);

    -- Grille-pain (oct 2025)
    eid := gen_random_uuid();
    INSERT INTO expenses VALUES (eid, coloc, eb, cat_electro, 'Grille-pain Moulinex', NULL, 29.99, 'equal', '2025-10-05', '2025-10-05'::TIMESTAMP);
    INSERT INTO expense_splits VALUES (gen_random_uuid(), eid, vb, 15.00, 50, false), (gen_random_uuid(), eid, eb, 14.99, 50, false);

    -- Table IKEA (mars 2024)
    eid := gen_random_uuid();
    INSERT INTO expenses VALUES (eid, coloc, eb, cat_mobilier, 'Table IKEA LACK', NULL, 129.00, 'equal', '2024-03-20', '2024-03-20'::TIMESTAMP);
    INSERT INTO expense_splits VALUES (gen_random_uuid(), eid, vb, 64.50, 50, false), (gen_random_uuid(), eid, eb, 64.50, 50, false);

    -- Etagere (juin 2024)
    eid := gen_random_uuid();
    INSERT INTO expenses VALUES (eid, coloc, vb, cat_mobilier, 'Etagere murale KALLAX', NULL, 49.99, 'equal', '2024-06-10', '2024-06-10'::TIMESTAMP);
    INSERT INTO expense_splits VALUES (gen_random_uuid(), eid, vb, 25.00, 50, false), (gen_random_uuid(), eid, eb, 24.99, 50, false);

    -- Lampe (nov 2024)
    eid := gen_random_uuid();
    INSERT INTO expenses VALUES (eid, coloc, eb, cat_mobilier, 'Lampe de salon', NULL, 35.00, 'equal', '2024-11-18', '2024-11-18'::TIMESTAMP);
    INSERT INTO expense_splits VALUES (gen_random_uuid(), eid, vb, 17.50, 50, false), (gen_random_uuid(), eid, eb, 17.50, 50, false);

    -- Cadeau cremaillere (avril 2024)
    eid := gen_random_uuid();
    INSERT INTO expenses VALUES (eid, coloc, eb, cat_autre, 'Cadeau cremaillere voisins', NULL, 25.00, 'equal', '2024-04-05', '2024-04-05'::TIMESTAMP);
    INSERT INTO expense_splits VALUES (gen_random_uuid(), eid, vb, 12.50, 50, false), (gen_random_uuid(), eid, eb, 12.50, 50, false);

    -- Fournitures (oct 2024)
    eid := gen_random_uuid();
    INSERT INTO expenses VALUES (eid, coloc, vb, cat_autre, 'Photocopies + fournitures', NULL, 8.50, 'equal', '2024-10-22', '2024-10-22'::TIMESTAMP);
    INSERT INTO expense_splits VALUES (gen_random_uuid(), eid, vb, 4.25, 50, false), (gen_random_uuid(), eid, eb, 4.25, 50, false);

    -- Trousse premiers soins (mai 2024)
    eid := gen_random_uuid();
    INSERT INTO expenses VALUES (eid, coloc, eb, cat_autre, 'Pharmacie (trousse premiers soins)', NULL, 22.50, 'equal', '2024-05-18', '2024-05-18'::TIMESTAMP);
    INSERT INTO expense_splits VALUES (gen_random_uuid(), eid, vb, 11.25, 50, false), (gen_random_uuid(), eid, eb, 11.25, 50, false);

    -- Fete coloc (dec 2024)
    eid := gen_random_uuid();
    INSERT INTO expenses VALUES (eid, coloc, vb, cat_autre, 'Soiree Nouvel An (alcool + deco)', NULL, 55.00, 'equal', '2024-12-30', '2024-12-30'::TIMESTAMP);
    INSERT INTO expense_splits VALUES (gen_random_uuid(), eid, vb, 27.50, 50, false), (gen_random_uuid(), eid, eb, 27.50, 50, false);

    -- Cle supplementaire (fev 2025)
    eid := gen_random_uuid();
    INSERT INTO expenses VALUES (eid, coloc, vb, cat_autre, 'Double de cles', NULL, 18.00, 'equal', '2025-02-10', '2025-02-10'::TIMESTAMP);
    INSERT INTO expense_splits VALUES (gen_random_uuid(), eid, vb, 9.00, 50, false), (gen_random_uuid(), eid, eb, 9.00, 50, false);

    -- Barbecue ete 2025
    eid := gen_random_uuid();
    INSERT INTO expenses VALUES (eid, coloc, eb, cat_autre, 'Barbecue jetable + charbon', NULL, 15.00, 'equal', '2025-07-14', '2025-07-14'::TIMESTAMP);
    INSERT INTO expense_splits VALUES (gen_random_uuid(), eid, vb, 7.50, 50, false), (gen_random_uuid(), eid, eb, 7.50, 50, false);

END $$;
