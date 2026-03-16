'use client'

import { useCallback, useEffect, useState } from 'react'
import { AlertCircle, Check, Plus, Save, Trash2 } from 'lucide-react'
import { createBrowserClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import type { Missao, Questao, QuestionType, Trilha } from '@/types/database'

type EditableTrilha = Omit<Trilha, 'id' | 'slug'> & { id?: string; slug?: string }
type EditableMissao = Omit<Missao, 'id'> & { id?: string }
type QuestionDraft = {
    id?: string
    missao_id?: string
    tipo: QuestionType
    enunciado: string
    enunciado_coreano: string
    opcoesText: string
    resposta_correta: string
    explicacao: string
    ordem: number
    ativo: boolean
}

interface ContentManagerProps {
    initialTrilhaId: string | null
    onSaved: () => void
}

const questionTypeOptions: Array<{ value: QuestionType; label: string }> = [
    { value: 'multipla_escolha', label: 'Multipla escolha' },
    { value: 'verdadeiro_falso', label: 'Verdadeiro ou falso' },
    { value: 'completar_frase', label: 'Completar frase' },
    { value: 'associar_par', label: 'Associar par' },
    { value: 'coreano_para_portugues', label: 'Coreano para portugues' },
    { value: 'portugues_para_coreano', label: 'Portugues para coreano' },
]

function slugify(value: string) {
    return value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
}

function emptyTrilha(): EditableTrilha {
    return {
        titulo: '',
        descricao: '',
        ordem: 1,
        icone: '📘',
        cor: '#5B7CFA',
        ativo: true,
        created_at: new Date().toISOString(),
    }
}

function emptyMissao(trilhaId: string | undefined, ordem: number): EditableMissao {
    return {
        trilha_id: trilhaId || '',
        titulo: '',
        descricao: '',
        ordem,
        xp_recompensa: 20,
        badge_id: null,
        ativo: true,
    }
}

function toQuestionDraft(question: Questao): QuestionDraft {
    return {
        id: question.id,
        missao_id: question.missao_id,
        tipo: question.tipo,
        enunciado: question.enunciado,
        enunciado_coreano: question.enunciado_coreano || '',
        opcoesText: Array.isArray(question.opcoes) ? question.opcoes.join('\n') : '',
        resposta_correta: question.resposta_correta,
        explicacao: question.explicacao || '',
        ordem: question.ordem,
        ativo: question.ativo,
    }
}

function emptyQuestion(missaoId: string, ordem: number): QuestionDraft {
    return {
        missao_id: missaoId,
        tipo: 'multipla_escolha',
        enunciado: '',
        enunciado_coreano: '',
        opcoesText: '',
        resposta_correta: '',
        explicacao: '',
        ordem,
        ativo: true,
    }
}

export function ContentManager({ initialTrilhaId, onSaved }: ContentManagerProps) {
    const supabase = createBrowserClient()
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)
    const [trilha, setTrilha] = useState<EditableTrilha>(emptyTrilha())
    const [missoes, setMissoes] = useState<EditableMissao[]>([])
    const [selectedMission, setSelectedMission] = useState<EditableMissao | null>(null)
    const [questoes, setQuestoes] = useState<QuestionDraft[]>([])

    const loadQuestions = useCallback(async (missaoId: string) => {
        const { data, error: questionsError } = await supabase
            .from('questoes')
            .select('*')
            .eq('missao_id', missaoId)
            .order('ordem')

        if (questionsError) {
            setError(questionsError.message)
            return
        }

        setQuestoes(((data as Questao[]) || []).map(toQuestionDraft))
    }, [supabase])

    const loadDatabase = useCallback(async (trilhaId: string) => {
        setLoading(true)
        setError(null)

        const [{ data: trailData, error: trailError }, { data: missionsData, error: missionsError }] = await Promise.all([
            supabase.from('trilhas').select('*').eq('id', trilhaId).single(),
            supabase.from('missoes').select('*').eq('trilha_id', trilhaId).order('ordem'),
        ])

        if (trailError || !trailData) {
            setError(trailError?.message || 'Nao foi possivel carregar a trilha.')
            setLoading(false)
            return
        }

        if (missionsError) {
            setError(missionsError.message)
            setLoading(false)
            return
        }

        setTrilha(trailData as EditableTrilha)
        const loadedMissions = (missionsData as EditableMissao[]) || []
        setMissoes(loadedMissions)

        if (loadedMissions.length > 0) {
            setSelectedMission(loadedMissions[0])
            await loadQuestions(loadedMissions[0].id as string)
        } else {
            setSelectedMission(null)
            setQuestoes([])
        }

        setLoading(false)
    }, [loadQuestions, supabase])

    useEffect(() => {
        let active = true

        async function initialize() {
            if (initialTrilhaId) {
                const [{ data: trailData, error: trailError }, { data: missionsData, error: missionsError }] = await Promise.all([
                    supabase.from('trilhas').select('*').eq('id', initialTrilhaId).single(),
                    supabase.from('missoes').select('*').eq('trilha_id', initialTrilhaId).order('ordem'),
                ])

                if (!active) return

                if (trailError || !trailData) {
                    setError(trailError?.message || 'Nao foi possivel carregar a trilha.')
                    return
                }

                if (missionsError) {
                    setError(missionsError.message)
                    return
                }

                setTrilha(trailData as EditableTrilha)
                const loadedMissions = (missionsData as EditableMissao[]) || []
                setMissoes(loadedMissions)

                if (loadedMissions.length > 0) {
                    setSelectedMission(loadedMissions[0])
                    const { data: questionData } = await supabase
                        .from('questoes')
                        .select('*')
                        .eq('missao_id', loadedMissions[0].id as string)
                        .order('ordem')

                    if (!active) return
                    setQuestoes(((questionData as Questao[]) || []).map(toQuestionDraft))
                } else {
                    setSelectedMission(null)
                    setQuestoes([])
                }

                return
            }

            setTrilha(emptyTrilha())
            setMissoes([])
            setSelectedMission(null)
            setQuestoes([])
        }

        void initialize()

        return () => {
            active = false
        }
    }, [initialTrilhaId, supabase])

    const handleTrailSave = async () => {
        setSaving(true)
        setError(null)

        const payload = {
            titulo: trilha.titulo,
            descricao: trilha.descricao,
            ordem: trilha.ordem,
            icone: trilha.icone,
            cor: trilha.cor,
            ativo: trilha.ativo,
            slug: trilha.slug || slugify(trilha.titulo || 'trilha'),
        }

        if (trilha.id) {
            const { error: updateError } = await supabase.from('trilhas').update(payload).eq('id', trilha.id)
            if (updateError) {
                setSaving(false)
                setError(updateError.message)
                return
            }
        } else {
            const { data, error: insertError } = await supabase.from('trilhas').insert(payload).select().single()
            if (insertError || !data) {
                setSaving(false)
                setError(insertError?.message || 'Nao foi possivel criar a trilha.')
                return
            }

            setTrilha(data as EditableTrilha)
        }

        setSaving(false)
        setSuccessMessage('Trilha salva com sucesso.')
        onSaved()
    }

    const handleMissionSave = async () => {
        if (!trilha.id || !selectedMission) return

        setSaving(true)
        setError(null)

        const payload = {
            trilha_id: trilha.id,
            titulo: selectedMission.titulo,
            descricao: selectedMission.descricao,
            ordem: selectedMission.ordem,
            xp_recompensa: selectedMission.xp_recompensa,
            badge_id: selectedMission.badge_id,
            ativo: selectedMission.ativo,
        }

        if (selectedMission.id) {
            const { error: updateError } = await supabase.from('missoes').update(payload).eq('id', selectedMission.id)
            if (updateError) {
                setSaving(false)
                setError(updateError.message)
                return
            }
        } else {
            const { data, error: insertError } = await supabase.from('missoes').insert(payload).select().single()
            if (insertError || !data) {
                setSaving(false)
                setError(insertError?.message || 'Nao foi possivel criar a missao.')
                return
            }

            setSelectedMission(data as EditableMissao)
        }

        await loadDatabase(trilha.id)
        setSaving(false)
        setSuccessMessage('Missão salva com sucesso.')
    }

    const handleAddMission = () => {
        if (!trilha.id) {
            setError('Salve a trilha antes de adicionar missoes.')
            return
        }

        setSelectedMission(emptyMissao(trilha.id, missoes.length + 1))
        setQuestoes([])
    }

    const handleQuestionChange = (index: number, field: keyof QuestionDraft, value: string | number | boolean) => {
        setQuestoes((current) =>
            current.map((question, currentIndex) =>
                currentIndex === index ? { ...question, [field]: value } : question
            )
        )
    }

    const handleAddQuestion = () => {
        if (!selectedMission?.id) {
            setError('Salve a missao antes de adicionar questoes.')
            return
        }

        setQuestoes((current) => [...current, emptyQuestion(selectedMission.id as string, current.length + 1)])
    }

    const handleDeleteQuestion = async (question: QuestionDraft, index: number) => {
        if (!question.id) {
            setQuestoes((current) => current.filter((_, currentIndex) => currentIndex !== index))
            return
        }

        const { error: deleteError } = await supabase.from('questoes').delete().eq('id', question.id)
        if (deleteError) {
            setError(deleteError.message)
            return
        }

        setQuestoes((current) => current.filter((_, currentIndex) => currentIndex !== index))
    }

    const handleQuestionsSave = async () => {
        if (!selectedMission?.id) return

        setSaving(true)
        setError(null)

        for (const question of questoes) {
            const payload = {
                missao_id: selectedMission.id,
                tipo: question.tipo,
                enunciado: question.enunciado,
                enunciado_coreano: question.enunciado_coreano || null,
                opcoes: question.opcoesText
                    ? question.opcoesText.split('\n').map((option) => option.trim()).filter(Boolean)
                    : [],
                resposta_correta: question.resposta_correta,
                explicacao: question.explicacao || null,
                ordem: question.ordem,
                ativo: question.ativo,
            }

            if (question.id) {
                const { error: updateError } = await supabase.from('questoes').update(payload).eq('id', question.id)
                if (updateError) {
                    setSaving(false)
                    setError(updateError.message)
                    return
                }
            } else {
                const { error: insertError } = await supabase.from('questoes').insert(payload)
                if (insertError) {
                    setSaving(false)
                    setError(insertError.message)
                    return
                }
            }
        }

        await loadQuestions(selectedMission.id)
        setSaving(false)
        setSuccessMessage('Questões salvas com sucesso.')
    }

    if (loading) {
        return <div className="rounded-3xl border border-border/60 bg-white p-8 text-center text-sm text-muted-foreground">Carregando editor...</div>
    }

    return (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="space-y-4 lg:col-span-4">
                <Card className="border-0 shadow-sm">
                    <CardHeader>
                        <CardTitle>Trilha</CardTitle>
                        <CardDescription>Configure os dados principais da trilha.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Título</Label>
                            <Input value={trilha.titulo} onChange={(event) => setTrilha((current) => ({ ...current, titulo: event.target.value }))} />
                        </div>
                        <div className="space-y-2">
                            <Label>Descrição</Label>
                            <Textarea value={trilha.descricao || ''} onChange={(event) => setTrilha((current) => ({ ...current, descricao: event.target.value }))} />
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-2">
                                <Label>Ícone</Label>
                                <Input value={trilha.icone || ''} onChange={(event) => setTrilha((current) => ({ ...current, icone: event.target.value }))} />
                            </div>
                            <div className="space-y-2">
                                <Label>Cor</Label>
                                <Input value={trilha.cor || ''} onChange={(event) => setTrilha((current) => ({ ...current, cor: event.target.value }))} />
                            </div>
                            <div className="space-y-2">
                                <Label>Ordem</Label>
                                <Input type="number" value={trilha.ordem} onChange={(event) => setTrilha((current) => ({ ...current, ordem: Number(event.target.value) || 1 }))} />
                            </div>
                        </div>
                        <div className="flex items-center justify-between rounded-2xl bg-secondary/30 px-4 py-3">
                            <div>
                                <p className="text-sm font-semibold">Trilha ativa</p>
                                <p className="text-xs text-muted-foreground">Disponível para as alunas no app.</p>
                            </div>
                            <Switch checked={trilha.ativo} onCheckedChange={(checked) => setTrilha((current) => ({ ...current, ativo: checked }))} />
                        </div>
                        <Button onClick={handleTrailSave} disabled={saving} className="w-full bg-[var(--color-coreduca-blue)] text-white">
                            <Save className="mr-2 h-4 w-4" />
                            {saving ? 'Salvando...' : 'Salvar trilha'}
                        </Button>
                    </CardContent>
                </Card>

                {error && (
                    <div className="flex items-start gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}
                {successMessage && (
                    <div className="flex items-start gap-2 rounded-2xl bg-green-50 px-4 py-3 text-sm text-green-700">
                        <Check className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>{successMessage}</span>
                    </div>
                )}
            </div>

            <div className="space-y-6 lg:col-span-8">
                <Card className="border-0 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Missões</CardTitle>
                            <CardDescription>Gerencie as lições da trilha atual.</CardDescription>
                        </div>
                        <Button variant="outline" onClick={handleAddMission}>
                            <Plus className="mr-2 h-4 w-4" />
                            Nova missão
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {missoes.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {missoes.map((missao) => (
                                    <button
                                        key={missao.id}
                                        onClick={() => {
                                            setSelectedMission(missao)
                                            void loadQuestions(missao.id as string)
                                        }}
                                        className={`rounded-full px-4 py-2 text-sm font-semibold ${selectedMission?.id === missao.id
                                            ? 'bg-[var(--color-coreduca-blue)] text-white'
                                            : 'bg-secondary text-muted-foreground'
                                            }`}
                                    >
                                        {missao.titulo || `Missão ${missao.ordem}`}
                                    </button>
                                ))}
                            </div>
                        )}

                        {!selectedMission ? (
                            <div className="rounded-2xl bg-secondary/30 p-6 text-sm text-muted-foreground">
                                Selecione uma missão ou crie uma nova para começar.
                            </div>
                        ) : (
                            <div className="space-y-4 rounded-3xl border border-border/60 p-5">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label>Título da missão</Label>
                                        <Input value={selectedMission.titulo} onChange={(event) => setSelectedMission((current) => current ? { ...current, titulo: event.target.value } : current)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>XP</Label>
                                        <Input type="number" value={selectedMission.xp_recompensa} onChange={(event) => setSelectedMission((current) => current ? { ...current, xp_recompensa: Number(event.target.value) || 0 } : current)} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Descrição</Label>
                                    <Textarea value={selectedMission.descricao || ''} onChange={(event) => setSelectedMission((current) => current ? { ...current, descricao: event.target.value } : current)} />
                                </div>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label>Ordem</Label>
                                        <Input type="number" value={selectedMission.ordem} onChange={(event) => setSelectedMission((current) => current ? { ...current, ordem: Number(event.target.value) || 1 } : current)} />
                                    </div>
                                    <div className="flex items-center justify-between rounded-2xl bg-secondary/30 px-4 py-3">
                                        <div>
                                            <p className="text-sm font-semibold">Missão ativa</p>
                                            <p className="text-xs text-muted-foreground">Disponível para quiz no app.</p>
                                        </div>
                                        <Switch checked={selectedMission.ativo} onCheckedChange={(checked) => setSelectedMission((current) => current ? { ...current, ativo: checked } : current)} />
                                    </div>
                                </div>
                                <Button onClick={handleMissionSave} disabled={saving} className="bg-[var(--color-coreduca-purple)] text-white">
                                    <Save className="mr-2 h-4 w-4" />
                                    {saving ? 'Salvando...' : 'Salvar missão'}
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Questões</CardTitle>
                            <CardDescription>Edite o conteúdo do quiz da missão selecionada.</CardDescription>
                        </div>
                        <Button variant="outline" onClick={handleAddQuestion} disabled={!selectedMission?.id}>
                            <Plus className="mr-2 h-4 w-4" />
                            Nova questão
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {questoes.length === 0 ? (
                            <div className="rounded-2xl bg-secondary/30 p-6 text-sm text-muted-foreground">
                                Nenhuma questão cadastrada para esta missão.
                            </div>
                        ) : (
                            questoes.map((question, index) => (
                                <div key={question.id || `${question.ordem}-${index}`} className="space-y-4 rounded-3xl border border-border/60 p-5">
                                    <div className="flex items-center justify-between">
                                        <Badge variant="secondary">Questão {index + 1}</Badge>
                                        <Button variant="ghost" className="text-red-600" onClick={() => handleDeleteQuestion(question, index)}>
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Remover
                                        </Button>
                                    </div>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label>Tipo</Label>
                                            <select
                                                value={question.tipo}
                                                onChange={(event) => handleQuestionChange(index, 'tipo', event.target.value as QuestionType)}
                                                className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
                                            >
                                                {questionTypeOptions.map((option) => (
                                                    <option key={option.value} value={option.value}>
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Ordem</Label>
                                            <Input type="number" value={question.ordem} onChange={(event) => handleQuestionChange(index, 'ordem', Number(event.target.value) || 1)} />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Enunciado</Label>
                                        <Textarea value={question.enunciado} onChange={(event) => handleQuestionChange(index, 'enunciado', event.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Apoio em coreano</Label>
                                        <Input value={question.enunciado_coreano} onChange={(event) => handleQuestionChange(index, 'enunciado_coreano', event.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Opções</Label>
                                        <Textarea
                                            value={question.opcoesText}
                                            onChange={(event) => handleQuestionChange(index, 'opcoesText', event.target.value)}
                                            placeholder="Uma opção por linha"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Resposta correta</Label>
                                        <Input value={question.resposta_correta} onChange={(event) => handleQuestionChange(index, 'resposta_correta', event.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Explicação</Label>
                                        <Textarea value={question.explicacao} onChange={(event) => handleQuestionChange(index, 'explicacao', event.target.value)} />
                                    </div>
                                    <div className="flex items-center justify-between rounded-2xl bg-secondary/30 px-4 py-3">
                                        <div>
                                            <p className="text-sm font-semibold">Questão ativa</p>
                                            <p className="text-xs text-muted-foreground">Se desligada, não aparece no quiz.</p>
                                        </div>
                                        <Switch checked={question.ativo} onCheckedChange={(checked) => handleQuestionChange(index, 'ativo', checked)} />
                                    </div>
                                </div>
                            ))
                        )}

                        <Button onClick={handleQuestionsSave} disabled={saving || !selectedMission?.id} className="bg-[var(--color-coreduca-blue)] text-white">
                            <Save className="mr-2 h-4 w-4" />
                            {saving ? 'Salvando...' : 'Salvar questões'}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
