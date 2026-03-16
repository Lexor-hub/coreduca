/* eslint-disable @typescript-eslint/no-require-imports */
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase URL or Service Role Key in .env.local')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setAdmin(email) {
    console.log(`Buscando usuário com email: ${email}...`)

    const { data: users, error: userError } = await supabase.auth.admin.listUsers()
    if (userError) {
        console.error('Erro ao listar usuários:', userError)
        process.exit(1)
    }

    const user = users.users.find(u => u.email === email)

    if (!user) {
        console.error(`Usuário com email ${email} não encontrado.`)
        process.exit(1)
    }

    console.log(`Usuário encontrado: ${user.id}`)
    console.log('Atualizando profile para is_admin = true...')

    const { error: updateError } = await supabase
        .from('profiles')
        .update({ is_admin: true })
        .eq('id', user.id)

    if (updateError) {
        console.error('Erro ao atualizar profile:', updateError)
        process.exit(1)
    }

    console.log(`✅ Sucesso! O usuário ${email} agora é um administrador.`)
}

const emailArgs = process.argv.slice(2)
if (emailArgs.length !== 1) {
    console.error('Uso: node scripts/set_admin.js <email_do_usuario>')
    process.exit(1)
}

setAdmin(emailArgs[0])
