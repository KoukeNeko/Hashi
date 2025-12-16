import React from 'react';
import { FormDialog } from '../../../components/ui/Form';
import { DatabaseService } from '../../../services/api';
import { Database as DatabaseIcon } from 'lucide-react';

interface CreateDatabaseDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const CreateDatabaseDialog: React.FC<CreateDatabaseDialogProps> = ({
    isOpen,
    onClose,
    onSuccess,
}) => {
    const handleSubmit = async (values: { name: string; type: string }) => {
        await DatabaseService.create(values.name, values.type);
        onSuccess();
    };

    return (
        <FormDialog
            isOpen={isOpen}
            onClose={onClose}
            onSubmit={handleSubmit}
            title="Create Database"
            titleIcon={<DatabaseIcon size={20} />}
            submitText="Create"
            fields={[
                {
                    name: 'name',
                    label: 'Database Name',
                    placeholder: 'my_database',
                    required: true,
                    mono: true,
                },
                {
                    name: 'type',
                    label: 'Type',
                    type: 'select',
                    options: [
                        { value: 'MySQL', label: 'MySQL' },
                        { value: 'PostgreSQL', label: 'PostgreSQL' },
                    ],
                    defaultValue: 'MySQL',
                    required: true,
                },
            ]}
        />
    );
};
