-- Insert default global expense categories
INSERT INTO expense_categories (name, icon, color, colocation_id, is_global) VALUES
    ('Loyer', 'home', '#5682F2', NULL, true),
    ('Courses', 'shopping-cart', '#4CAF50', NULL, true),
    ('Electricite', 'zap', '#FFC107', NULL, true),
    ('Eau', 'droplet', '#2196F3', NULL, true),
    ('Internet', 'wifi', '#9C27B0', NULL, true),
    ('Gaz', 'flame', '#FF5722', NULL, true),
    ('Assurance', 'shield', '#607D8B', NULL, true),
    ('Entretien', 'tool', '#795548', NULL, true),
    ('Menage', 'spray-can', '#E91E63', NULL, true),
    ('Mobilier', 'sofa', '#3F51B5', NULL, true),
    ('Electromenager', 'tv', '#00BCD4', NULL, true),
    ('Loisirs', 'gamepad-2', '#F1C086', NULL, true),
    ('Restaurant', 'utensils', '#FF9800', NULL, true),
    ('Transport', 'car', '#8BC34A', NULL, true),
    ('Sante', 'heart-pulse', '#F44336', NULL, true),
    ('Autre', 'more-horizontal', '#9E9E9E', NULL, true);
