import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { supabase } from '../config/supabase.js';

// A non-privileged client for verifying tokens
const supabaseAuth = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);

export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'Unauthorized: Missing or invalid Authorization header');
    }

    const token = authHeader.split(' ')[1];

    // Verify token with Supabase Auth
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);

    if (authError || !user) {
      throw new ApiError(401, 'Unauthorized: Invalid token');
    }

    // Lookup user profile using the service role client
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      throw new ApiError(401, 'Unauthorized: Profile not found');
    }

    // Attach verified identity and role to req.user
    req.user = {
      id: profile.id,
      role: profile.role,
      email: user.email
    };

    next();
  } catch (error) {
    next(error);
  }
};

export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return next(new ApiError(401, 'Unauthorized: User identity not found'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new ApiError(403, 'Forbidden: Insufficient permissions'));
    }

    next();
  };
};
