const supabaseUrl = "https://qkpwzudgzmaiaysskqjk.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrcHd6dWRnem1haWF5c3NrcWprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2MzA4OTAsImV4cCI6MjA5MTIwNjg5MH0.VN7OaT066u-sgeXk4WXMTpIcJWPIGjmRGiWqdFZApO4";

const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

async function fetchProducts() {
  const { data, error } = await supabaseClient
    .from('products')
    .select('*')
    .order('is_sold_out', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching products:', error);
    return [];
  }
  // Ensure options field exists for all products
  return (data || []).map(p => ({
    ...p,
    options: p.options || {}
  }));
}

async function addProduct(product) {
  const { data, error } = await supabaseClient
    .from('products')
    .insert([product]);

  if (error) {
    console.error('Error adding product:', error);
    throw error;
  }
  return data;
}

async function updateProduct(id, updates) {
  const { data, error } = await supabaseClient
    .from('products')
    .update(updates)
    .eq('id', id);

  if (error) {
    console.error('Error updating product:', error);
    throw error;
  }
  return data;
}

async function deleteProduct(id) {
  const { data, error } = await supabaseClient
    .from('products')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
  return data;
}

async function uploadFile(file, bucket = 'media') {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
  const filePath = `${fileName}`;

  const { data, error } = await supabaseClient.storage
    .from(bucket)
    .upload(filePath, file);

  if (error) {
    if (error.message.includes('Bucket not found')) {
      alert(`오류: Supabase Storage에 '${bucket}' 버킷이 없습니다.\n대시보드에서 Public 버킷 '${bucket}'을 생성해주세요.`);
    }
    console.error('Error uploading file:', error);
    throw error;
  }

  const { data: publicData } = supabaseClient.storage
    .from(bucket)
    .getPublicUrl(filePath);

  return publicData.publicUrl;
}

window.api = {
  fetchProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  uploadFile
};
