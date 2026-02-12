-- Migration to change rating column from integer to text
ALTER TABLE public.media_items
DROP CONSTRAINT IF EXISTS media_items_rating_check;

ALTER TABLE public.media_items
ALTER COLUMN rating TYPE text USING CASE 
    WHEN rating >= 4 THEN 'like'
    WHEN rating <= 2 THEN 'dislike'
    ELSE null -- Mapping 3 to null (neutral) or you can choose 'like'
END;

ALTER TABLE public.media_items
ADD CONSTRAINT media_items_rating_check CHECK (rating in ('like', 'dislike'));
