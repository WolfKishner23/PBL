        const users = await sequelize.query('SELECT id, name, company, role FROM "users"', { type: QueryTypes.SELECT });
        console.log('--- USERS ---');
        console.table(users);

        const invoices = await sequelize.query('SELECT id, "invoiceNumber", "debtorCompany", "uploadedBy", status, "riskLevel", "riskScore" FROM "invoices" WHERE "invoiceNumber" IN (\'INV-2026-249\', \'INV-2026-873\')', { type: QueryTypes.SELECT });
        console.log('--- TARGET INVOICES ---');
        console.table(invoices);

        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

debug();
