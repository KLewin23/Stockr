import { trpc } from '@/renderer/main';
import { useContext, useState } from 'react';
// import { trpc } from '@/renderer/main';
import { MainContext } from '@/renderer/Context';
import { useFieldArray, useForm } from 'react-hook-form';
import {
    Button,
    DatePicker,
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    Input,
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
    Tabs,
    TabsList,
    TabsTrigger,
    notify,
} from '@/shadcn';

import { keys } from '../../../../utils';
import { FieldDef, FieldValue, TConfig, dataRow } from '../../../../config';

interface FormValues {
    type: keyof TConfig['componentTypes'];
    fields: FieldValue<FieldDef>[];
}

const NewItem = (): JSX.Element => {
    const [isOpen, setIsOpen] = useState(false);
    const form = useForm<FormValues>();
    const { config, refetchData } = useContext(MainContext);
    const addItem = trpc.writeData.useMutation({
        onSuccess: () => {
            notify.success('Item successfully added!');
            form.reset({ fields: [], type: undefined });
            refetchData();
            setIsOpen(false);
        },
    });
    const { fields, replace } = useFieldArray<FormValues>({
        name: 'fields',
        control: form.control,
    });

    const type = form.watch('type');

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button>Input Stock</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Input Stock</DialogTitle>
                    <DialogDescription>Add a new item and information about it.</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form
                        className={'col gap-2'}
                        onSubmit={form.handleSubmit(v => {
                            if (v.fields.some(f => f.value === undefined))
                                return notify.error('All fields muse be complete.');
                            const parsedFields = dataRow.safeParse(v.fields);
                            if (!parsedFields.success) return notify.error('Something went wrong');
                            return addItem.mutate({
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
                                        <Select
                                            onValueChange={v => {
                                                field.onChange(v);
                                                replace(config.componentTypes[v]);
                                            }}
                                            defaultValue={field.value}
                                        >
                                            <SelectTrigger className={'w-[250px]'}>
                                                <SelectValue
                                                    placeholder={'Select a component type'}
                                                />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectGroup>
                                                    {keys(config.componentTypes).map(type => (
                                                        <SelectItem
                                                            className={'cursor-pointer'}
                                                            key={type}
                                                            value={type}
                                                        >
                                                            {type}
                                                        </SelectItem>
                                                    ))}
                                                </SelectGroup>
                                            </SelectContent>
                                        </Select>
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

export default NewItem;
