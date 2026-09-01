
-- Drop and recreate the trigger function with proper SECURITY DEFINER
-- so it runs as the function owner (postgres/superuser), bypassing RLS
-- on the profiles table during user signup when auth.uid() is still NULL.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'customer'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Log the error but don't block signup
    RAISE WARNING 'handle_new_user failed for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Ensure the function is owned by postgres to guarantee superuser-level bypass of RLS
ALTER FUNCTION public.handle_new_user() OWNER TO postgres;

-- Re-create the trigger to make sure it's properly attached
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
