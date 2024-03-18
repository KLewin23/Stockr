import { useContext } from 'react';
import { trpc } from '@/renderer/main';
import { useForm } from 'react-hook-form';
import { MainContext } from '@/renderer/Context';
import { TrashIcon } from '@radix-ui/react-icons';
import {
    Button,
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
    Separator,
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    notify,
} from '@/shadcn';

interface FormValues {
    componentName: string;
    fieldName: string;
    type: 'string' | 'number' | 'boolean' | 'date';
    fields: {
        fieldName: string;
        type: 'string' | 'number' | 'boolean' | 'date';
    }[];
}

const NewComponentType = ({ onComplete }: { onComplete: () => void }): JSX.Element => {
    const form = useForm<FormValues>({ defaultValues: { fields: [] } });
    const { config, refetch } = useContext(MainContext);
    const writeConfig = trpc.writeConfig.useMutation({
        onSuccess: () => {
            notify.success(`Component type ${form.getValues('fieldName')} successfully created.`);
            refetch();
            onComplete();
        },
    });
    const fields = form.watch('fields');

    return (
        <div className={'row h-full w-full grow'}>
            <div className={'col grow h-full'}>
                <Form {...form}>
                    <form
                        className={'grow h-full px-14'}
                        onSubmit={form.handleSubmit(v => {
                            if (!v.componentName)
                                return notify.error('A component type is required.');
                            if (!v.fields || fields.length === 0)
                                return notify.error('Fields are required.');
                            writeConfig.mutate({
                                config: {
                                    componentTypes: {
                                        ...config.componentTypes,
                                        [v.componentName]: v.fields.map(field => ({
                                            name: field.fieldName,
                                            type: field.type,
                                        })),
                                    },
                                },
                            });
                            console.log(v);
                        })}
                    >
                        <div className={'col max-w-96 py-10  gap-6'}>
                            <div className={'col gap-2'}>
                                <p className={'text-1 font-semibold'}>Type Info</p>
                                <div className={'pl-4'}>
                                    <FormField
                                        control={form.control}
                                        name="componentName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Component Type</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder={`Enter a ${field.name}`}
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormDescription />
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>
                            <div className={'col gap-2'}>
                                <p className={'text-1 font-semibold'}>Add Field</p>
                                <div className={'col pl-4 gap-2'}>
                                    <FormField
                                        control={form.control}
                                        name="fieldName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Field Name</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder={`Enter a field name`}
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormDescription />
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="type"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Field Type</FormLabel>
                                                <FormControl>
                                                    <Select
                                                        onValueChange={v => {
                                                            field.onChange(v);
                                                        }}
                                                        defaultValue={field.value}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue
                                                                placeholder={'Select a field type'}
                                                            />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectGroup>
                                                                <SelectItem
                                                                    className={'cursor-pointer'}
                                                                    value={'string'}
                                                                >
                                                                    String
                                                                </SelectItem>
                                                                <SelectItem
                                                                    className={'cursor-pointer'}
                                                                    value={'number'}
                                                                >
                                                                    Number
                                                                </SelectItem>
                                                                <SelectItem
                                                                    className={'cursor-pointer'}
                                                                    value={'date'}
                                                                >
                                                                    Date
                                                                </SelectItem>
                                                                <SelectItem
                                                                    className={'cursor-pointer'}
                                                                    value={'boolean'}
                                                                >
                                                                    Boolean
                                                                </SelectItem>
                                                            </SelectGroup>
                                                        </SelectContent>
                                                    </Select>
                                                </FormControl>
                                                <FormDescription />
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <Button
                                        className={'w-full'}
                                        type={'button'}
                                        onClick={() => {
                                            const values = form.getValues();
                                            if (
                                                values.fields.some(
                                                    f => f.fieldName === values.fieldName,
                                                )
                                            )
                                                return notify.error(
                                                    `A field with the name '${values.fieldName}' already exists.`,
                                                );
                                            if (!values.fieldName)
                                                return notify.error('A field name is required');
                                            if (!values.type)
                                                return notify.error('A field type is required');
                                            form.setValue('fields', [
                                                ...values.fields,
                                                { fieldName: values.fieldName, type: values.type },
                                            ]);
                                        }}
                                    >
                                        Add field
                                    </Button>
                                </div>
                            </div>
                        </div>
                        <div className={'flex justify-end w-full gap-4'}>
                            <Button className={'w-[150px]'}>Subit Type</Button>
                            <Button
                                className={'w-[100px]'}
                                variant={'destructive'}
                                type={'button'}
                                onClick={onComplete}
                            >
                                Cancel
                            </Button>
                        </div>
                    </form>
                </Form>
            </div>
            <Separator orientation={'vertical'} />
            <div className={'col grow h-full'}>
                <p className={'text-1 font-semibold p-4'}>Existing Fields</p>
                <Table className={'h-full'}>
                    <TableCaption>A list of fields.</TableCaption>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Delete</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {fields.map(field => (
                            <TableRow key={field.fieldName}>
                                <TableCell className={'font-medium w-min'}>
                                    {field.fieldName}
                                </TableCell>
                                <TableCell className={'font-medium w-min'}>{field.type}</TableCell>
                                <TableCell className={'font-medium w-min'}>
                                    <Button
                                        variant={'outline'}
                                        size={'icon'}
                                        onClick={() =>
                                            form.setValue(
                                                'fields',
                                                form
                                                    .getValues('fields')
                                                    .filter(
                                                        filterField =>
                                                            filterField.fieldName !==
                                                            field.fieldName,
                                                    ),
                                            )
                                        }
                                    >
                                        <TrashIcon />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};

export default NewComponentType;
