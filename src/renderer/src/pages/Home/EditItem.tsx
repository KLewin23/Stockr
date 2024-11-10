import { keys } from '@/utils';
import { match } from 'ts-pattern';
import { trpc } from '@/renderer/main';
import { useContext, useEffect } from 'react';
import { MainContext } from '@/renderer/Context';
import { useFieldArray, useForm } from 'react-hook-form';
import { FieldDef, FieldValue, TConfig, TValueMap, dataRow } from '@/config';
import {
    Button,
    DatePicker,
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    Input,
    Tabs,
    TabsList,
    TabsTrigger,
    notify,
} from '@/shadcn';

interface FormValues {
    type: keyof TConfig['componentTypes'];
    fields: FieldValue<FieldDef>[];
}

export interface EditedRowProps {
    entry: TValueMap;
    type: keyof TConfig['componentTypes'];
    index: number;
}

interface Props {
    rowData: EditedRowProps | null;
    onClose: () => void;
}

const EditItem = ({ rowData, onClose }: Props): JSX.Element => {
    const form = useForm<FormValues>();
    const { refetchData, config } = useContext(MainContext);
    const addItem = trpc.updateData.useMutation({
        onSuccess: () => {
            notify.success('Item successfully updated!');
            form.reset({ fields: [], type: undefined });
            refetchData();
            onClose();
        },
    });
    const { fields } = useFieldArray<FormValues>({
        name: 'fields',
        control: form.control,
    });

    useEffect(() => {
        const componentType = keys(config.componentTypes).find(key => key === rowData?.type);
        if (!rowData?.entry || !rowData?.type || !componentType) return;

        const nonDefinedFields = config.componentTypes[componentType].reduce<
            FieldValue<FieldDef>[]
        >((acc, field) => {
            return rowData.entry.has(field.name)
                ? acc
                : [...acc, { name: field.name, value: undefined, type: field.type }];
        }, []);
        form.setValue(
            'fields',
            Array.from(rowData?.entry)
                .map<FieldValue<FieldDef>>(([key, value]) => {
                    if (value instanceof Date)
                        return { name: key, value: value as Date, type: 'date' };
                    if (typeof value === 'string')
                        return {
                            name: key,
                            value: value,
                            type: 'string',
                        };
                    if (typeof value === 'number')
                        return {
                            name: key,
                            value,
                            type: 'number',
                        };
                    return {
                        name: key,
                        value,
                        type: 'boolean',
                    };
                })
                .concat(nonDefinedFields),
        );
        form.setValue('type', rowData?.type);
    }, [rowData?.entry, rowData?.type]);

    const type = form.watch('type');

    return (
        <Dialog open={rowData !== null} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Stock</DialogTitle>
                    <DialogDescription>Modify items and information about them.</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form
                        className={'col gap-2'}
                        onSubmit={form.handleSubmit(v => {
                            if (!rowData) return notify.error('Error opening row.');
                            if (v.fields.some(f => f.value === undefined))
                                return notify.error('All fields muse be complete.');
                            const parsedFields = dataRow.safeParse(v.fields);
                            if (!parsedFields.success) return notify.error('Something went wrong');
                            return addItem.mutate({
                                index: rowData.index,
                                componentName: v.type,
                                rowValues: parsedFields.data,
                            });
                        })}
                    >
                        <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Component Type</FormLabel>
                                    <FormControl>
                                        <Input value={field.value} disabled />
                                    </FormControl>
                                    <FormDescription />
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        {form.getValues('type') !== undefined ? (
                            <p className={'text-sm'}>Fields</p>
                        ) : null}
                        <div className={'pl-4'}>
                            {fields.map((field, index) => (
                                <FormField
                                    key={field.id}
                                    control={form.control}
                                    name={`fields.${index}`}
                                    render={({ field: innerField }) => (
                                        <FormItem>
                                            <FormLabel>{field.name}</FormLabel>
                                            <FormControl>
                                                <>
                                                    {innerField.value.type === 'string' ||
                                                    innerField.value.type === 'number' ? (
                                                        <Input
                                                            placeholder={`Enter a ${field.name}`}
                                                            type={
                                                                innerField.value.type === 'string'
                                                                    ? 'text'
                                                                    : 'number'
                                                            }
                                                            onChange={v => {
                                                                innerField.onChange({
                                                                    ...field,
                                                                    value:
                                                                        innerField.value.type ===
                                                                        'string'
                                                                            ? v.target.value
                                                                            : parseInt(
                                                                                  v.target.value,
                                                                                  10,
                                                                              ),
                                                                });
                                                            }}
                                                            value={innerField.value.value}
                                                        />
                                                    ) : null}
                                                    {innerField.value.type === 'boolean' ? (
                                                        <Tabs
                                                            defaultValue={'false'}
                                                            value={
                                                                innerField.value.value === true
                                                                    ? 'true'
                                                                    : 'false'
                                                            }
                                                            onValueChange={v =>
                                                                innerField.onChange({
                                                                    ...field,
                                                                    value:
                                                                        v === 'true' ? true : false,
                                                                })
                                                            }
                                                        >
                                                            <TabsList>
                                                                <TabsTrigger value={'true'}>
                                                                    True
                                                                </TabsTrigger>
                                                                <TabsTrigger value={'false'}>
                                                                    False
                                                                </TabsTrigger>
                                                            </TabsList>
                                                        </Tabs>
                                                    ) : null}
                                                    {innerField.value.type === 'date' ? (
                                                        <DatePicker
                                                            date={innerField.value.value}
                                                            setDate={v =>
                                                                innerField.onChange({
                                                                    ...field,
                                                                    value: v,
                                                                })
                                                            }
                                                        />
                                                    ) : null}
                                                </>
                                            </FormControl>
                                            <FormDescription />
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            ))}
                        </div>
                        <Button disabled={type === undefined}>Submit</Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

export default EditItem;
